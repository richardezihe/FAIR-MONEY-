import { Telegraf, Context, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { storage } from './storage';
import {
  BOT_COMMANDS, 
  REQUIRED_GROUPS, 
  SUPPORT_CHANNEL,
  NEWS_CHANNEL,
  CLAIM_BONUS_AMOUNT,
  REFERRAL_BONUS_AMOUNT,
  MIN_WITHDRAWAL_AMOUNT,
  MAX_WITHDRAWAL_AMOUNT,
  CLAIM_COOLDOWN_MINUTES,
  DEFAULT_STATS,
  CURRENCY
} from '@shared/constants';
import {
  isWeekend,
  formatDate,
  formatCurrency,
  generateReferralLink,
  extractReferrerId,
  getMinutesBetweenDates,
  formatTime
} from './utils';

interface BotContext extends Context {
  session?: {
    waitingForBankDetails?: boolean;
  };
}

// Initialize the bot
export function initBot(token: string): Telegraf<BotContext> {
  const bot = new Telegraf<BotContext>(token);

  // Setup bot commands and middleware
  setupBotCommands(bot);
  setupBotMiddleware(bot);
  
  // Return the configured bot
  return bot;
}

// Setup bot commands
function setupBotCommands(bot: Telegraf<BotContext>) {
  // Start command
  bot.command('start', async (ctx) => {
    const startPayload = ctx.message.text.trim();
    const telegramId = ctx.from.id.toString();
    let user = await storage.getTelegramUser(telegramId);
    
    // Check if this is a referral
    const referrerId = extractReferrerId(startPayload);
    
    // Create user if they don't exist
    if (!user) {
      user = await storage.createTelegramUser({
        telegramId,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name || '',
        username: ctx.from.username || '',
        joinedAt: new Date(),
        balance: 0,
        referrerId: referrerId || undefined,
        referralCount: 0,
        hasJoinedGroups: false,
        lastBonusClaim: undefined,
        bankAccountNumber: undefined,
        bankName: undefined,
        bankAccountName: undefined
      });
      
      // Update referrer stats if this is a referral
      if (referrerId) {
        const referrer = await storage.getTelegramUser(referrerId);
        if (referrer) {
          // Add referral bonus to the referrer
          await storage.updateTelegramUser(referrerId, {
            balance: (referrer.balance || 0) + REFERRAL_BONUS_AMOUNT,
            referralCount: (referrer.referralCount || 0) + 1
          });
          
          // Send notification to the referrer
          bot.telegram.sendMessage(
            referrerId, 
            `🎉 Congratulations! You have a new referral: ${user.firstName} ${user.lastName || ''}.\n\n+${formatCurrency(REFERRAL_BONUS_AMOUNT)} has been added to your balance!`
          );
        }
      }
    }
    
    // Check if user has joined the required groups
    if (!user.hasJoinedGroups) {
      await promptToJoinGroups(ctx);
      return;
    }
    
    // Welcome message
    await ctx.reply(`🏠 Welcome To Main Menu`, getMainMenuKeyboard());
  });
  
  // Handle "Joined" message
  bot.hears(BOT_COMMANDS.JOINED, async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const user = await storage.getTelegramUser(telegramId);
    
    if (!user) {
      // Prompt to start the bot first
      await ctx.reply("Please start the bot with /start command first.");
      return;
    }
    
    if (user.hasJoinedGroups) {
      await ctx.reply("You have already joined our groups. Thank you!", getMainMenuKeyboard());
      return;
    }
    
    // Update user's status
    await storage.updateTelegramUser(telegramId, {
      hasJoinedGroups: true
    });
    
    // If user doesn't have bank details yet, prompt to add them
    if (!user.bankAccountNumber || !user.bankName || !user.bankAccountName) {
      await promptForBankDetails(ctx);
      return;
    }
    
    // Otherwise, show the main menu
    await ctx.reply("🏠 Welcome To Main Menu", getMainMenuKeyboard());
  });
  
  // Balance command
  bot.hears(BOT_COMMANDS.BALANCE, async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const user = await storage.getTelegramUser(telegramId);
    
    if (!user) {
      await ctx.reply("Please start the bot with /start command first.");
      return;
    }
    
    if (!user.hasJoinedGroups) {
      await promptToJoinGroups(ctx);
      return;
    }
    
    await ctx.reply(
      `💰 Your Current Balance: ${formatCurrency(user.balance || 0)}\n\n` +
      `👥 Total Referrals: ${user.referralCount || 0} User(s)\n\n` +
      `🏦 Your Bank Details:\n` +
      (user.bankAccountNumber ? 
        `Account Number: ${user.bankAccountNumber}\n` +
        `Bank Name: ${user.bankName || ''}\n` +
        `Account Name: ${user.bankAccountName || ''}` : 
        "Not set yet. Please update your account details.")
    );
  });
  
  // Invite command
  bot.hears(BOT_COMMANDS.INVITE, async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const user = await storage.getTelegramUser(telegramId);
    
    if (!user) {
      await ctx.reply("Please start the bot with /start command first.");
      return;
    }
    
    if (!user.hasJoinedGroups) {
      await promptToJoinGroups(ctx);
      return;
    }
    
    const botInfo = await bot.telegram.getMe();
    const referralLink = generateReferralLink(telegramId, botInfo.username!);
    
    await ctx.reply(
      `👥 Total Refers = ${user.referralCount} User(s)\n\n` +
      `📩 Invite To Earn ${formatCurrency(REFERRAL_BONUS_AMOUNT)} Per Invite\n\n` +
      `📲 Your invite link:\n${referralLink}\n\n` +
      `Share this link with your friends and earn when they join!`
    );
  });
  
  // Account Details command has been removed
  
  // Statistics command
  bot.hears(BOT_COMMANDS.STATISTICS, async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const user = await storage.getTelegramUser(telegramId);
    
    if (!user) {
      await ctx.reply("Please start the bot with /start command first.");
      return;
    }
    
    if (!user.hasJoinedGroups) {
      await promptToJoinGroups(ctx);
      return;
    }
    
    // Use fake stats as requested
    await ctx.reply(
      `📊 Fairmoney Live Statistics 📊\n\n` +
      `💰 Total Payouts: ${formatCurrency(DEFAULT_STATS.TOTAL_PAYOUTS)}\n` +
      `👥 Total Users: ${DEFAULT_STATS.TOTAL_USERS} User(s)`
    );
  });
  
  // Withdraw command
  bot.hears(BOT_COMMANDS.WITHDRAW, async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const user = await storage.getTelegramUser(telegramId);
    
    if (!user) {
      await ctx.reply("Please start the bot with /start command first.");
      return;
    }
    
    if (!user.hasJoinedGroups) {
      await promptToJoinGroups(ctx);
      return;
    }
    
    // Check if it's a weekend
    if (!isWeekend()) {
      await ctx.reply(
        "⚠️ Withdrawals are only available on weekends (Saturday and Sunday).\n" +
        "Please try again on the weekend.",
        getMainMenuKeyboard()
      );
      return;
    }
    
    // Check if user has enough balance
    if ((user.balance || 0) < MIN_WITHDRAWAL_AMOUNT) {
      await ctx.reply(
        `⚠️ Must Own Atleast ${formatCurrency(MIN_WITHDRAWAL_AMOUNT)} To Make Withdrawal\n\n` +
        `Your current balance: ${formatCurrency(user.balance || 0)}\n\n` +
        `Join Fairmoney on Telegram and make ₦20k - ₦50k daily with your phone, it's free to join\n\n` +
        `Withdrawal is every Saturday, click on the link now to join, thank me later\n` +
        `https://t.me/${(await bot.telegram.getMe()).username}?start=ref_${telegramId}`,
        getMainMenuKeyboard()
      );
      return;
    }
    
    // Prompt for withdrawal amount
    await ctx.reply(
      `💸 Withdrawal Request\n\n` +
      `Your current balance: ${formatCurrency(user.balance || 0)}\n\n` +
      `Minimum withdrawal: ${formatCurrency(MIN_WITHDRAWAL_AMOUNT)}\n` +
      `Maximum withdrawal: ${formatCurrency(MAX_WITHDRAWAL_AMOUNT)}\n\n` +
      `Please enter the amount you want to withdraw (${CURRENCY}XXXX):`,
      Markup.removeKeyboard()
    );
    
    // Set context to wait for amount
    ctx.session = {
      ...ctx.session,
      waitingForBankDetails: false
    };
  });
  
  // Claim Bonus command
  bot.hears(BOT_COMMANDS.CLAIM, async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const user = await storage.getTelegramUser(telegramId);
    
    if (!user) {
      await ctx.reply("Please start the bot with /start command first.");
      return;
    }
    
    if (!user.hasJoinedGroups) {
      await promptToJoinGroups(ctx);
      return;
    }
    
    // Check cooldown
    const now = new Date();
    if (user.lastBonusClaim) {
      const lastClaimDate = new Date(user.lastBonusClaim);
      const minutesSinceLastClaim = getMinutesBetweenDates(lastClaimDate, now);
      
      if (minutesSinceLastClaim < CLAIM_COOLDOWN_MINUTES) {
        const timeLeft = CLAIM_COOLDOWN_MINUTES - minutesSinceLastClaim;
        await ctx.reply(
          `⚠️ Please wait ${timeLeft} more minute${timeLeft !== 1 ? 's' : ''} before claiming again.\n\n` +
          `Last claimed: ${formatTime(lastClaimDate)}`
        );
        return;
      }
    }
    
    // Award bonus
    const updatedUser = await storage.updateTelegramUser(telegramId, {
      balance: (user.balance || 0) + CLAIM_BONUS_AMOUNT,
      lastBonusClaim: now
    });
    
    await ctx.reply(
      `Congratulations 🎉🎉🎉\n` +
      `You Have Just Earned\n` +
      `+${formatCurrency(CLAIM_BONUS_AMOUNT)} 👈\n\n` +
      `Click Again After 1 Minute\n` +
      `News: @${NEWS_CHANNEL}\n` +
      `Help: @${SUPPORT_CHANNEL}\n\n` +
      `⚠️ Wait 1 minute before clicking again. Do not click too fast to avoid getting banned`
    );
  });
  
  // Handle text messages (for bank details and withdrawal amounts)
  bot.on(message('text'), async (ctx) => {
    const telegramId = ctx.from.id.toString();
    const user = await storage.getTelegramUser(telegramId);
    
    if (!user) {
      await ctx.reply("Please start the bot with /start command first.");
      return;
    }
    
    // If waiting for bank details
    if (ctx.session?.waitingForBankDetails) {
      const text = ctx.message.text.trim();
      
      // Parse the input - try different formats
      
      // 1. Try the format from screenshots (3 lines/values)
      const textLines = text.split('\n').filter(line => line.trim().length > 0);
      
      // 2. Try the space-separated format as a fallback
      const singleLinePattern = /^\s*(\d+)\s+(.+)\s+(.+)\s*$/;
      const singleLineMatch = text.match(singleLinePattern);
      
      // Default bank details if user doesn't provide them
      let accountNumber, bankName, accountName;
      
      // Process the bank details if we have a valid format
      if (textLines.length === 3) {
        // Multi-line format
        [accountNumber, bankName, accountName] = textLines;
      } else if (singleLineMatch) {
        // Single line format
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const [unused, accNum, bnkName, accName] = singleLineMatch;
        accountNumber = accNum;
        bankName = bnkName;
        accountName = accName;
      } else {
        // If format is invalid, use default values
        accountNumber = "123456789";
        bankName = "Sample Bank";
        accountName = user.firstName + " " + (user.lastName || "");
      }
      
      // Update user's bank details
      await storage.updateTelegramUser(telegramId, {
        bankAccountNumber: accountNumber.trim(),
        bankName: bankName.trim(),
        bankAccountName: accountName.trim()
      });
      
      // Reset session state
      ctx.session.waitingForBankDetails = false;
      
      // Check if user has enough balance for withdrawal
      const updatedUser = await storage.getTelegramUser(telegramId);
      const canWithdraw = (updatedUser?.balance || 0) >= MIN_WITHDRAWAL_AMOUNT;
      
      // Show confirmation
      await ctx.reply(
        `📊 Your Bank Details:\n` +
        `Account Number: ${accountNumber.trim()}\n` +
        `Bank Name: ${bankName.trim()}\n` +
        `Account Name: ${accountName.trim()}\n\n` +
        `✅ These details will be used for withdrawals.` +
        (canWithdraw ? `\n\nYou have enough balance to withdraw. Click the "Withdraw" button to proceed.` : ''),
        getMainMenuKeyboard()
      );
      return;
    } 
    // Handle withdrawal amount
    else if (user.hasJoinedGroups) {
      const amountText = ctx.message.text.trim().replace(/[^0-9]/g, '');
      const amount = parseInt(amountText);
      
      if (isNaN(amount)) {
        await ctx.reply(
          "Please enter a valid amount (numbers only).", 
          getMainMenuKeyboard()
        );
        return;
      }
      
      // Check if amount is within allowed range
      if (amount < MIN_WITHDRAWAL_AMOUNT) {
        await ctx.reply(
          `Minimum withdrawal amount is ${formatCurrency(MIN_WITHDRAWAL_AMOUNT)}.`,
          getMainMenuKeyboard()
        );
        return;
      }
      
      if (amount > MAX_WITHDRAWAL_AMOUNT) {
        await ctx.reply(
          `Maximum withdrawal amount is ${formatCurrency(MAX_WITHDRAWAL_AMOUNT)}.`,
          getMainMenuKeyboard()
        );
        return;
      }
      
      // Check if user has enough balance
      if (amount > (user.balance || 0)) {
        await ctx.reply(
          `You don't have enough balance for this withdrawal.\n` +
          `Your current balance: ${formatCurrency(user.balance || 0)}`,
          getMainMenuKeyboard()
        );
        return;
      }
      
      // Create withdrawal request
      const withdrawalRequest = await storage.createWithdrawalRequest({
        telegramUserId: telegramId,
        amount: amount,
        createdAt: new Date(),
        status: 'pending',
        bankAccountNumber: user.bankAccountNumber || '',
        bankName: user.bankName || '',
        bankAccountName: user.bankAccountName || ''
      });
      
      // Deduct amount from user's balance
      await storage.updateTelegramUser(telegramId, {
        balance: (user.balance || 0) - amount
      });
      
      await ctx.reply(
        `✅ Your withdrawal request has been submitted successfully!\n\n` +
        `Amount: ${formatCurrency(amount)}\n` +
        `Date: ${formatDate(new Date())}\n` +
        `Status: Pending\n\n` +
        `Your request will be processed within 24 hours.\n` +
        `You will receive a notification once it's processed.`,
        getMainMenuKeyboard()
      );
    }
  });
}

// Setup bot middleware
function setupBotMiddleware(bot: Telegraf<BotContext>) {
  // Session middleware
  bot.use((ctx, next) => {
    ctx.session = ctx.session || {};
    return next();
  });
}

// Helper functions
async function promptToJoinGroups(ctx: BotContext) {
  await ctx.reply(
    `🔴 Join Our Channel To Proceed\n` +
    `@${REQUIRED_GROUPS[0]} 👉\n` +
    `@${REQUIRED_GROUPS[1]} 👉\n\n` +
    `✅ After Joining, Click on Joined`,
    Markup.keyboard([['Joined']])
      .resize()
      .oneTime()
  );
}

async function promptForBankDetails(ctx: BotContext) {
  await ctx.reply(
    `💎 Enter Bank Details 💎\n\n` +
    `Simply type a number for your account or you can press any key to continue with default bank details.\n\n` +
    `Your details will be used for processing withdrawals.`
  );
  
  // Set context to wait for bank details
  ctx.session = {
    ...ctx.session,
    waitingForBankDetails: true
  };
}

function getMainMenuKeyboard() {
  return Markup.keyboard([
    [BOT_COMMANDS.BALANCE, BOT_COMMANDS.INVITE],
    [BOT_COMMANDS.STATISTICS, BOT_COMMANDS.WITHDRAW],
    [BOT_COMMANDS.CLAIM]
  ])
    .resize();
}

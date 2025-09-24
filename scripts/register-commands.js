/**
 * Manual Command Registration Script
 * Run this to force register Discord slash commands
 */

require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const config = {
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN
};

async function registerCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, '..', 'src', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  console.log(`Found ${commandFiles.length} command files`);

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      console.log(`✅ Loaded command: ${command.data.name}`);
    } else {
      console.log(`❌ Invalid command file: ${file}`);
    }
  }

  if (commands.length === 0) {
    console.log('❌ No valid commands found');
    return;
  }

  try {
    console.log(`\n🚀 Registering ${commands.length} slash commands...`);
    
    const rest = new REST({ version: '10' }).setToken(config.DISCORD_BOT_TOKEN);
    
    // Get bot user ID first
    const botUser = await rest.get(Routes.user('@me'));
    console.log(`Bot ID: ${botUser.id}`);
    
    const data = await rest.put(
      Routes.applicationCommands(botUser.id),
      { body: commands }
    );

    console.log(`✅ Successfully registered ${data.length} slash commands`);
    
    // List registered commands
    console.log('\nRegistered commands:');
    data.forEach(cmd => {
      console.log(`  - /${cmd.name}: ${cmd.description}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to register slash commands:', error.message);
    console.error('Full error:', error);
  }
}

// Run the registration
registerCommands().then(() => {
  console.log('\n🎉 Command registration complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Registration failed:', error);
  process.exit(1);
}); 
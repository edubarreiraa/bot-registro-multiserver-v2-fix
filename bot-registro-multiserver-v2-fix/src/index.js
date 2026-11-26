require('dotenv').config();
const {Client,GatewayIntentBits,Partials,REST,Routes,SlashCommandBuilder,PermissionFlagsBits,ActionRowBuilder,ButtonBuilder,ButtonStyle,ModalBuilder,TextInputBuilder,TextInputStyle,StringSelectMenuBuilder,RoleSelectMenuBuilder,ChannelSelectMenuBuilder,ChannelType,EmbedBuilder}=require('discord.js');
const store=require('./storage');
const token=process.env.DISCORD_TOKEN;
if(!token){console.error('Configure DISCORD_TOKEN no .env/ambiente');process.exit(1);}
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMembers],partials:[Partials.GuildMember]});
const commands=[
 new SlashCommandBuilder().setName('configurar-registro').setDescription('Configurar o registro deste servidor').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
 new SlashCommandBuilder().setName('registro-painel').setDescription('Publicar painel de registro').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
 new SlashCommandBuilder().setName('registro-status').setDescription('Consultar configuracao').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
 new SlashCommandBuilder().setName('registro-reset').setDescription('Apagar configuracao deste servidor').setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(x=>x.toJSON());
const admin=i=>i.memberPermissions?.has(PermissionFlagsBits.Administrator);
function embed(cfg){return new EmbedBuilder().setColor(0x5865F2).setTitle('Configuracao do Registro').addFields(
{name:'Canal do painel',value:cfg.panelChannelId?`<#${cfg.panelChannelId}>`:'Nao definido'},
{name:'Cargos selecionaveis',value:cfg.allowedRoles?.length?cfg.allowedRoles.map(id=>`<@&${id}>`).join(', '):'Nenhum'},
{name:'Formato do apelido',value:cfg.nicknameFormat||'{nome} | {rg}'}
);}
function rows(){return [
new ActionRowBuilder().addComponents(new ChannelSelectMenuBuilder().setCustomId('cfg_channel').setPlaceholder('Escolha canal do painel').setChannelTypes(ChannelType.GuildText).setMaxValues(1)),
new ActionRowBuilder().addComponents(new RoleSelectMenuBuilder().setCustomId('cfg_roles').setPlaceholder('Escolha cargos que os membros podem selecionar').setMinValues(1).setMaxValues(10)),
new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('cfg_format').setPlaceholder('Formato do apelido').addOptions(
{label:'Nome | RG',value:'format_nome_rg'},{label:'RG | Nome',value:'format_rg_nome'},{label:'Nome [RG]',value:'format_nome_rg_brackets'}))
];}
function defaultCfg(){return {panelChannelId:null,allowedRoles:[],nicknameFormat:'{nome} | {rg}'};}
client.once('ready',async()=>{console.log(`Online: ${client.user.tag}`);try{await new REST({version:'10'}).setToken(token).put(Routes.applicationCommands(client.user.id),{body:commands});console.log('Comandos registrados.');}catch(e){console.error('Erro ao registrar comandos',e);}});
client.on('interactionCreate',async i=>{try{
 if(i.isChatInputCommand()){
  if(!admin(i))return i.reply({content:'Somente administradores podem usar este comando.',ephemeral:true});
  const cfg=store.get(i.guildId);
  if(i.commandName==='configurar-registro')return i.reply({embeds:[embed(cfg||defaultCfg())],components:rows(),ephemeral:true});
  if(i.commandName==='registro-status')return cfg?i.reply({embeds:[embed(cfg)],ephemeral:true}):i.reply({content:'Ainda nao configurado. Use `/configurar-registro`.',ephemeral:true});
  if(i.commandName==='registro-reset'){store.remove(i.guildId);return i.reply({content:'Configuracao apagada deste servidor.',ephemeral:true});}
  if(i.commandName==='registro-painel'){
   if(!cfg?.panelChannelId||!cfg.allowedRoles?.length)return i.reply({content:'Configure canal e cargos primeiro com `/configurar-registro`.',ephemeral:true});
   const ch=i.guild.channels.cache.get(cfg.panelChannelId);if(!ch)return i.reply({content:'Canal configurado nao encontrado; reconfigure.',ephemeral:true});
   const e=new EmbedBuilder().setColor(0x5865F2).setTitle('REGISTRO').setDescription(`Para se identificar no servidor, clique no botão abaixo.

Você vai informar:
• Nome de jogo completo
• RG / ID
• Sua identificação

Após concluir, o bot ajustará seu apelido e seu cargo automaticamente.`);
   const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('start_registration').setLabel('Fazer Registro').setStyle(ButtonStyle.Primary));
   await ch.send({embeds:[e],components:[row]});return i.reply({content:`Painel publicado em ${ch}.`,ephemeral:true});
  }
 }
 if(i.isChannelSelectMenu()&&i.customId==='cfg_channel'){
  if(!admin(i))return i.reply({content:'Sem permissao.',ephemeral:true});
  const cfg=store.get(i.guildId)||defaultCfg();cfg.panelChannelId=i.values[0];store.set(i.guildId,cfg);
  return i.update({embeds:[embed(cfg)],components:rows()});
 }
 if(i.isRoleSelectMenu()&&i.customId==='cfg_roles'){
  if(!admin(i))return i.reply({content:'Sem permissao.',ephemeral:true});
  const cfg=store.get(i.guildId)||defaultCfg();
  const botTop=i.guild.members.me.roles.highest.position;
  cfg.allowedRoles=i.values.filter(id=>{const r=i.guild.roles.cache.get(id);return r&&r.position<botTop;});
  store.set(i.guildId,cfg);
  const warn=cfg.allowedRoles.length!==i.values.length?'Alguns cargos foram ignorados por estarem acima do cargo do bot.':'';
  return i.update({embeds:[embed(cfg)],components:rows(),content:warn||null});
 }
 if(i.isStringSelectMenu()&&i.customId==='cfg_format'){
  if(!admin(i))return i.reply({content:'Sem permissao.',ephemeral:true});
  const formats={
   format_nome_rg:'{nome} | {rg}',
   format_rg_nome:'{rg} | {nome}',
   format_nome_rg_brackets:'{nome} [{rg}]'
  };
  const selected=formats[i.values[0]];
  if(!selected)return i.reply({content:'Formato invalido. Tente selecionar novamente.',ephemeral:true});
  await i.deferUpdate();
  const cfg=store.get(i.guildId)||defaultCfg();cfg.nicknameFormat=selected;store.set(i.guildId,cfg);
  return i.editReply({embeds:[embed(cfg)],components:rows(),content:null});
 }
 if(i.isButton()&&i.customId==='start_registration'){
  const cfg=store.get(i.guildId);if(!cfg?.allowedRoles?.length)return i.reply({content:'Registro ainda nao configurado.',ephemeral:true});
  const modal=new ModalBuilder().setCustomId('registration_modal').setTitle('Registro');
  modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reg_name').setLabel('Nome no jogo').setStyle(TextInputStyle.Short).setMinLength(2).setMaxLength(32).setRequired(true)),
  new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('reg_rg').setLabel('RG / ID').setStyle(TextInputStyle.Short).setMinLength(1).setMaxLength(20).setRequired(true)));
  return i.showModal(modal);
 }
 if(i.isModalSubmit()&&i.customId==='registration_modal'){
  const cfg=store.get(i.guildId);if(!cfg?.allowedRoles?.length)return i.reply({content:'Registro nao configurado.',ephemeral:true});
  const name=i.fields.getTextInputValue('reg_name').trim(),rg=i.fields.getTextInputValue('reg_rg').trim();
  const opts=cfg.allowedRoles.map(id=>{const role=i.guild.roles.cache.get(id);return role?{label:role.name.slice(0,100),value:id}:null;}).filter(Boolean);
  if(!opts.length)return i.reply({content:'Cargos configurados nao encontrados. Avise a administracao.',ephemeral:true});
  const menu=new StringSelectMenuBuilder().setCustomId(`choose_role|${encodeURIComponent(name)}|${encodeURIComponent(rg)}`).setPlaceholder('Selecione seu cargo').addOptions(opts).setMinValues(1).setMaxValues(1);
  return i.reply({content:'Escolha seu cargo:',components:[new ActionRowBuilder().addComponents(menu)],ephemeral:true});
 }
 if(i.isStringSelectMenu()&&i.customId.startsWith('choose_role|')){
  const cfg=store.get(i.guildId),parts=i.customId.split('|'),name=decodeURIComponent(parts[1]),rg=decodeURIComponent(parts[2]),roleId=i.values[0];
  if(!cfg?.allowedRoles?.includes(roleId))return i.reply({content:'Cargo nao permitido. Reinicie o registro.',ephemeral:true});
  const member=await i.guild.members.fetch(i.user.id),role=i.guild.roles.cache.get(roleId),botTop=i.guild.members.me.roles.highest.position;
  if(!role||role.position>=botTop)return i.reply({content:'O bot nao consegue gerenciar esse cargo. Avise um administrador.',ephemeral:true});
  const nickname=(cfg.nicknameFormat||'{nome} | {rg}').replaceAll('{nome}',name).replaceAll('{rg}',rg).slice(0,32);
  await member.setNickname(nickname,'Registro realizado pelo bot');
  const remove=cfg.allowedRoles.filter(id=>id!==roleId&&member.roles.cache.has(id));if(remove.length)await member.roles.remove(remove);
  await member.roles.add(roleId);
  return i.update({content:`Registro concluido! Apelido: **${nickname}**. Cargo **${role.name}** atribuido.`,components:[]});
 }
}catch(err){console.error(err);if(i.isRepliable()&&!i.replied&&!i.deferred)await i.reply({content:'Erro durante a interacao. Verifique as permissoes do bot.',ephemeral:true}).catch(()=>{});}});
client.login(token);

const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js')
const bacheroFunctions = require('../../functions')
var botName = bacheroFunctions.config.getValue('bachero', 'botName')
var sayWithoutPermissions = bacheroFunctions.config.getValue('bachero.module.message', 'sayWithoutPermissions')
var sayShowAuthor = bacheroFunctions.config.getValue('bachero.module.message', 'sayShowAuthor')
var botClient

// Créé la commande slash
var slashInfo = new SlashCommandBuilder()
.setName('say')
.setDescription(`Envoie un message ${sayShowAuthor ? '' : 'anonymement '}sur le serveur en tant que ${botName}`)
.addStringOption(option => option.setName('text')
	.setDescription('Contenu du message à envoyer')
	.setRequired(true)
	.setMaxLength(1999))
.addAttachmentOption(option => option.setName('attachment')
	.setDescription('Permet d\'ajouter un attachement au message')
	.setRequired(false))
if(!sayWithoutPermissions) slashInfo.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

// Exporter certaines fonctions
module.exports = {
	// Définir les infos de la commande slash
	slashInfo: slashInfo,

	// Code a executer quand la commande est appelée
	async execute(interaction){
		// Mettre la réponse en defer
		if(await interaction.deferReply({ ephemeral: true }).catch(err => { return 'stop' }) == 'stop') return

		// Obtenir le texte à envoyer
		var text = interaction.options.getString('text')
		text = text.replace(/\\n/g, '\n').replace(/%JUMP%/g, '\n').replace(/%DATE%/g, `<t:${Math.round(Date.now() / 1000)}:f>`)

		// Rajouter l'auteur
		if(sayShowAuthor) text = `\`${interaction.user.tag}\`\n${text}`

		// Vérifier sa taille
		if(text.length > 1999) return interaction.editReply({ content: 'Votre message dépasse la limite de caractère' }).catch(err => {})

		// Obtenir l'attachement
		var attachment = await interaction.options.getAttachment('attachment')
		if(attachment) attachment = new AttachmentBuilder(attachment.url)

		// Obtenir le client du bot
		if(!botClient) botClient = bacheroFunctions.botClient.get()

		// Finir l'exécution
		try {
			// Envoyer le message
			var messageOption = { content: text }
			if(attachment) messageOption.files = [attachment]
			botClient.channels.cache.get(interaction.channelId).send(messageOption)

			// Obtenir une astuce
			var astucesList = ["Vous pouvez écrire `\\n` pour faire un saut de ligne.", "La commande `/embed` permet d'afficher plus d'informations dans vos messages.", sayShowAuthor ? null : "Personne ne sait que vous êtes l'auteur de cette commande 🤫", "Certains textes sont automatiquements remplacés par des raccourcis, vous pouvez écrire `%DATE%` pour ajouter la date du jour."].filter(a => a != null)
			var randomAstuce = astucesList[Math.floor(Math.random() * astucesList.length)]

			// Répondre à l'interaction
			interaction.editReply({ content: `Message envoyé !\n> ${randomAstuce}` }).catch(err => {})
		} catch(err) {
			var embed = new EmbedBuilder()
			.setTitle("Envoi du message")
			.setDescription("Un problème est survenu lors de l'envoi du message :\n```\n" + (err?.toString()?.replace(/`/g, ' `') || err) + "\n```")
			.setColor(bacheroFunctions.config.getValue('bachero', 'embedColor'))
			.setFooter({ text: `Si vous pensez que ce problème a quelque chose à voir avec ${botName}, n'hésitez pas à le signaler` })
			return interaction.editReply({ embeds: [embed], components: [], content: null })
		}
	}
}
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Users = require('../models/users.model');
const Collections = require('../models/collections.model')
const Notes = require('../models/notes.model')

let siteMap = {};
let userMap = {};

const dateChange = (t) => {
	const delta = Date.now()-t;
	if (parseInt(delta/86400000) > 0) {
		return parseInt(delta/86400000)+" days ago";
	} else if (parseInt(delta/3600000) > 0) {
		return parseInt(delta/3600000)+" hours ago";
	} else if (parseInt(delta/60000)) {
		return parseInt(delta/60000)+" minutes ago";
	} else {
		return  parseInt(delta/1000) + " seconds ago";
	}
}
const addSiteMap = (site, uid) => {
	if (siteMap[site]) {
		siteMap[site][uid] = [];
	} else {
		siteMap[site] = {[uid]: []};
	}
}
const removeSiteMap = (site, uid) => {
	if (siteMap[site]) {
		delete siteMap[site][uid];
	}
}
const storeSiteMap = (siteId, userId, type, id, data = []) => {
	console.log(siteId, userId, type, id)
		for (const uId in siteMap[siteId]) {
			if (uId !== userId.toString()) {
				siteMap[siteId][uId].push({
					...data,
					'type': type,
					'id': id
				});
			}
		}
		console.log(siteMap[siteId])
}
const redirectURL = async (req, res) => {
	const collection = await Collections.findOne({_id: req.params.site});
	if (collection) {
		res.redirect(collection.site_url+'?donenote-id='+collection._id)
	} else {
		res.redirect("https://getnoute.com/install/")
		// res.status(404).send({error: "Page not found."})
	}
}
const sync = async (req, res) => {
	const token = req.body.token;
	if (token) {
		const existUser = await Users.findOne({token: token});
		if (existUser) {
			jwt.sign(
				{userId: existUser._id},
				process.env.SECRET_TOKEN,
				(err, bearerToken) => {
					if (err) {
						return res.status(400).send(err);
					}
					return res.status(200).send({
						status: 'ok',
						data: {
							token: bearerToken,
							avatar: existUser.avatar
						}
					})
				}

			)
		} else {
			let response = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=' + token);
			if (response.ok) {
				let json = await response.json();
				const users = new Users({
					name: json.name,
					email: json.email,
					avatar: json.picture,
					locale: json.local,
					token: token,
					period: Date.now() + 30*24*60*60
				});
				users.save().then(user => {
					jwt.sign(
						{userId: user._id + ''},
						process.env.SECRET_TOKEN,
						(err, bearerToken) => {
							// if (err) {
							// 	return res.status(400).send({error: err});
							// }
							return res.status(200).send({
								status: 'ok',
								data: {
									token: bearerToken,
									avatar: users.avatar
								}
							})
						}

					);
				}).catch(err => {
					return res.status(400).send({error: "error occured."})
				})
			} else {
				return res.status(401).send({error: "Invalid Token."})
			}
		}
	} else {
		return res.status(401).send({error:'Missing token'})
	}
}

const getCollection = async (req, res) => {
	const site = req.params.site;
	const isShare = site[site.length-1] !== "=";
	console.log(isShare)
	if (isShare) {
		const sharedNote = await Collections.findOne({_id: site});
		console.log(sharedNote)
		if (!sharedNote) {
			return res.send({message: "NOT FOUND"})
		}
			const notes = await Notes.find({siteId: site}).sort({created_at: -1});
			let notesArr = [];
			for (var i = 0; i < notes.length; i++) {
				notesArr.push({...notes[i]['_doc']});
				notesArr[i].id = notesArr[i]['_id'].toString();
				notesArr[i].created_at = dateChange(notesArr[i].created_at);
				if (notesArr[i]['userId'].toString() === req.user._id.toString()) {
					notesArr[i]['own'] = true;
				}
				notesArr[i]['replyes'] = [];
				let replyes = notes[i]['replyes'];
				for (var j = replyes.length - 1; j >= 0; j--) {
					notesArr[i]['replyes'].push({
						id: replyes[j]['_id'],
						content: replyes[j]['content'],
						created_at: dateChange(replyes[j].created_at),
						user: replyes[j]['user'],
						own: replyes[j]['userId'].toString() === req.user._id.toString()?true:false
					})
				}
			}
			addSiteMap(sharedNote._id, req.user._id);
			return res.send({data: {
				onGrace: sharedNote.onGrace,
				status: sharedNote.status,
				user: sharedNote.user,
				sub: sharedNote.sub,
				created_at: sharedNote.created_at,
				share: process.env.HOST_NAME + '/i/' + sharedNote._id,
				notes: notesArr,
				own: true,
				trial: req.user.trial,
				id: sharedNote._id,
				last_update: Date.now()
			}})			
	} else {
		const existCollection = await Collections.findOne({site: site, userId: req.user._id});
		// console.log(existCollection)
		if (existCollection) {
			const notes = await Notes.find({siteId: existCollection._id}).sort({created_at: -1});
			let notesArr = [];
			for (var i = 0; i < notes.length; i++) {
				notesArr.push({...notes[i]['_doc']});
				notesArr[i].id = notesArr[i]['_id'].toString();
				notesArr[i].created_at = dateChange(notesArr[i].created_at);
				if (notesArr[i]['userId'].toString() === req.user._id.toString()) {
					notesArr[i]['own'] = true;
				}
				notesArr[i]['replyes'] = [];
				let replyes = notes[i]['replyes'];
				for (var j = replyes.length - 1; j >= 0; j--) {
					notesArr[i]['replyes'].push({
						id: replyes[j]['_id'],
						content: replyes[j]['content'],
						created_at: dateChange(replyes[j].created_at),
						user: replyes[j]['user'],
						own: replyes[j]['userId'].toString() === req.user._id.toString()?true:false
					})
				}
			}
			addSiteMap(existCollection._id, req.user._id)
			return res.send({data: {
				onGrace: existCollection.onGrace,
				status: existCollection.status,
				user: existCollection.user,
				sub: existCollection.sub,
				created_at: existCollection.created_at,
				share: process.env.HOST_NAME + '/i/' + existCollection._id,
				notes: notesArr,
				own: true,
				trial: req.user.trial,
				id: existCollection._id,
				last_update: Date.now()
			}})
		} else {
			let buff = new Buffer(site, 'base64');
			let site_url = buff.toString('ascii');
			const collections = new Collections({
				userId: req.user._id,
				user: {
					name:req.user.name,
					avatar: req.user.avatar
				},
				site: site,
				site_url: site_url
			});
			collections.save().then(collection => {
				addSiteMap(collection._id, req.user._id)
				let data = {};
				data.onGrace = collection.onGrace;
				data.status = collection.status;
				data.sub = collection.sub;
				data.user = collection.user;
				data.created_at = collection.created_at;			
				data.notes = [];
				data.share = process.env.HOST_NAME + '/i/' + collections._id;
				data.own = true;
				data.trial = req.user.trial;
				data.id = collection._id;
				data.last_update = Date.now();
				return res.send({data: data});
			})
		}
	}
}
const noteStore = async (req, res) => {
	const {content, selector, x, y} = req.body;
	let site = req.params.site;
	const userId = req.user._id.toString();
	let siteId = '';
	const isShare = site[site.length-1] !== "=";
	if (isShare) {
		const sharedNote = await Collections.findOne({_id: site});
		site = sharedNote.site;
		siteId = sharedNote._id;
	} else {
		const sharedNote = await Collections.findOne({site: site, userId: userId});
		site = sharedNote.site;
		siteId = sharedNote._id;
	}
	const note = new Notes({
		content: content,
		selector: selector,
		x: x,
		y: y,
		user: {
			name: req.user.name,
			avatar:req.user.avatar
		},		
		site: site,
		siteId:  siteId,
		userId: userId
	});
	note.save().then(result => {
		storeSiteMap(siteId, userId, 'newnote', result._id)
		const data = {
			content: result.content,
			selector: result.selector,
			x: result.x,
			y: result.y,
			site: result.site,
			user: result.user,
			replyes: [],
			pinned: result.pinned,
			status: result.status,
			created_at: dateChange(result.created_at),			
			own: true,
			id: result._id
		}
		return res.send({data: data});
	})
}

const statusNote = async(req, res) => {
	const note = await Notes.findOne({'_id': req.params.id});
	if (note) {
		storeSiteMap(note.siteId, req.user._id, 'notestatus', note._id, {status: note.status==='active'?'done':'active'})
		note.status = note.status==='active'?'done':'active';
		note.save().then(result => {
			const data = {
				...result['_doc'],
				own: true,
				id: result._id
			}
			data.created_at = dateChange(data.created_at);
			return res.send({data: data});
		})
	}
}
const pinnedNote = async(req, res) => {
	const note = await Notes.findOne({'_id': req.params.id});
	storeSiteMap(note.siteId, req.user._id, 'notepinned', note._id)
	if (note) {
		note.pinned = note.pinned==='false'?'true':'false';
		note.save().then(result => {
			const data = {
				...result['_doc'],
				own: true,
				id: result._id
			}
			data.created_at = dateChange(data.created_at);
			return res.send({data: data});
		})
	}
}
const deleteNote = (req, res) => {
	Notes.findByIdAndDelete(req.params.id).then((data)=>{
		storeSiteMap(data.siteId, req.user._id, 'notedelete', req.params.id)
		return res.status(204);
	})
}
const updateNote = async(req, res) => {
	const {selector, x, y, content} = req.body;
	const note = await Notes.findOne({'_id': req.params.id});
	if (note) {
		if (!selector) storeSiteMap(note.siteId, req.user._id, 'noteupdate', note._id, {content: content})

		if (selector) note.selector = selector;
		if (content) note.content = content;
		if (x) note.x = x;
		if (y) note.y = y;
		note.save().then(result => {
			const data = {
				...result['_doc'],
				own: true,
				id: result._id
			}
			data.created_at = dateChange(data.created_at);
			return res.send({data: data});
		})
	}
}
const replyStore = async (req, res) => {
	const {content} = req.body;
	const id = req.params.id;
	Notes.findOne({'_id': id}).then(note=>{
		let data = {
			content: content,
			created_at: Date.now(),
			userId: req.user._id,
			user: {
				name: req.user.name,
				avatar: req.user.avatar
			}
		};
		note.replyes.push(data);
		note.save().then(result => {
			storeSiteMap(note.siteId, req.user._id, 'replystore', result.replyes[result.replyes.length-1]['_id'])
			return res.send({data: {...data, own:true, created_at: dateChange(data.created_at), id:result.replyes[result.replyes.length-1]['_id']}})
		})
	})
}
const replyUpdate = async (req, res) => {
	const notes = await Notes.find({});
	for (var i = 0; i < notes.length; i++) {
		for (var j = 0; j < notes[i]['replyes'].length; j++) {
			if (notes[i]['replyes'][j]['_id'].toString()===req.params.id.toString()) {
				const note = notes[i]['replyes'][j]
				notes[i]['replyes'][j]['content'] = req.body.content;
				storeSiteMap(notes[i]['siteId'], req.user._id, 'replyupdate', note._id, {content: req.body.content});
				notes[i].save().then(result => {
					return res.send({
						content: note['content'],
						created_at: dateChange(note['created_at']),
						id: note['_id'],
						user: note['user'],
						own: true
					})
				})
			}
		}
	}
}
const replyDelete = async (req, res) => {
	const notes = await Notes.find({});
	for (var i = 0; i < notes.length; i++) {
		for (var j = 0; j < notes[i]['replyes'].length; j++) {
			if (notes[i]['replyes'][j]['_id'].toString()===req.params.id.toString()) {
				let replyes = notes[i]['replyes'];
				storeSiteMap(notes[i]['siteId'], req.user._id, 'replydelete', replyes[j]['_id']);
				replyes.splice(j, 1);
				notes[i]['replyes'] = replyes;
				notes[i].save().then(result => {
					return res.status(204);
				})
			}
		}
	}
}
const getNote = async (id) => {
	const note = await Notes.findOne({_id: id});
	if (note) {
		return {
			...note['_doc'],
			type: 'newnote',
			own: false,
			id:note._id,
			created_at: dateChange(note.created_at)
		}
	} else {
		return false;
	}
}
const getReply = async (id) => {
	const note = await Notes.findOne({"replyes._id": id});
	for (var j = 0; j < note['replyes'].length; j++) {
		console.log(note['replyes'][j]);
		if (note['replyes'][j]['_id'].toString()===id.toString()) {
			const reply = note['replyes'][j];
			return {
				content: reply['content'],
				created_at: dateChange(reply['created_at']),
				id: reply['_id'],
				user: reply['user'],
				noteId: note._id,
				own: false
			}
		}
	}
	return false;
}
const update = async (req, res) => {
	const data = siteMap[req.params.site]?siteMap[req.params.site][req.user._id]:[];
	const realData = [];
	console.log(data)
	if (data && data.length > 0) {
		for (var i = 0; i < data.length; i++) {
			if (data[i]['type'] === 'newnote') {
				const newnote = await getNote(data[i]['id']);
				if (newnote) {
					newnote.type = 'newnote';
					realData.push(newnote);
				}
			} else if (data[i]['type']==='replystore') {
				const newreply = await getReply(data[i]['id']);
				if (newreply) {
					newreply.type = 'replystore';
					realData.push(newreply);
				}
			} else if (data[i]['type']==='notestatus') {
				const notestatus = await getNote(data[i]['id']);
				if (notestatus) {
					notestatus.type = 'notestatus';
					realData.push(notestatus);
				}
			} else {
				realData.push(data[i])
			}
			/* else if (data[i]['type'] === 'notedelete') {
				realData.push(data[i])
			} else if (data[i]['type'] === 'noteupdate') {
				realData.push(data[i])
			}*/
		}
		siteMap[req.params.site][req.user._id] = [];
	}
	return res.send(realData);
}
const disconnect = (req, res) => {
	removeSiteMap(req.params.site, req.user._id);
}
module.exports = {
	redirectURL,
	sync, 
	getCollection, 
	noteStore, 
	statusNote, 
	updateNote, 
	deleteNote,
	pinnedNote,
	replyStore,
	replyUpdate,
	replyDelete,
	update,
	disconnect
};
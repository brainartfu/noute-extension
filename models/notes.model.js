const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notesSchema = new Schema({
	site: {type: String,  required: true},
    userId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'users'},
    siteId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'collections'},
	user: {
		avatar: {type: String, required: true},
		name: {type: String, required: true}
	},
	content: {type: String, required: true},
	pinned: {type: String, default: false},
	replyes: [
		{
			content: {type: String, required: true},
			created_at: {type: Date, required: true},
		    userId: {type: String, required: true},
			user: {
				avatar: {type: String, required: true},
				name: {type: String, required: true}
			},
		}
	],
    selector: {type: String, required: true},
    x: {type: Number, required: true},
    y: {type: Number, required: true},
    status: {type: String, default: 'active'},
	created_at: {type: Date, default: Date.now},
})

const Notes = mongoose.model('notes', notesSchema);
module.exports = Notes;
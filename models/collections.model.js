const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const collectionsSchema = new Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'users'},
	site: {type: String, required: true},
	site_url: {type: String, required: true},
	onGrace: {type: Boolean, default: false},
	status: {type: Boolean, default: false},
	sub: {type: Boolean, default: false},
	created_at: {type: Date, default: Date.now}
})

const Collections = mongoose.model('collections', collectionsSchema);
module.exports = Collections;
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usersSchema = new Schema({
	name: {type: String, required: true},
	avatar: {type: String, required: true},
	permision: {type: Number, default: 0},  //0: free 1:pro
	created_at: {type: Date, default: Date.now},
	trial: {type: Number, default: 30},  //period for free or pro
	token: {type: String, required: true},
	locale: {type: String, required: false},
	collections: {type: Number, default: 0}
})

const Users = mongoose.model('users', usersSchema);
module.exports = Users;
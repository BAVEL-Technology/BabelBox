var mongoose = require('mongoose');
var DatabaseSchema = new mongoose.Schema({
    name: { type: 'String' },
    owner: { type: 'String' },
    props: [{
        name: { type: 'String', required: false },
        type: { type: 'String', required: false },
        required: {type: 'Boolean', default: false},
        default: { type: 'Mixed', default: null},
        bcrypt: { type: 'Boolean', default: false}
      }],
    created_at: { type: 'Date', default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const Database = mongoose.model("Database", DatabaseSchema);

module.exports = Database;

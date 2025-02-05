const mongoose = require('mongoose');

const fractalSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fractalType: { type: String, required: true },
    params: {
        xMin: Number,
        xMax: Number,
        yMin: Number,
        yMax: Number,
        maxIterations: Number,
        colorScheme: String,
        startColor: String, 
        endColor: String,   
        cRe: Number,        
        cIm: Number,        
    },
});

module.exports = mongoose.model('Fractal', fractalSchema);

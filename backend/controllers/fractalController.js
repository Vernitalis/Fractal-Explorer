const Fractal = require('../models/Fractal');

// Save fractal settings
exports.saveFractal = async (req, res) => {
    try {
        const fractal = new Fractal({
            user: req.user,
            fractalType: req.body.fractalType,
            params: req.body.params
        });
        await fractal.save();
        res.status(201).json({ message: 'Fractal settings saved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving fractal settings', error });
    }
};

// Get fractals for a user
exports.getUserFractals = async (req, res) => {
    try {
        const fractals = await Fractal.find({ user: req.user });
        res.status(200).json(fractals);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user fractals', error });
    }
};

// Delete a saved fractal
exports.deleteFractal = async (req, res) => {
    try {
        const fractal = await Fractal.findById(req.params.id);
        if (!fractal) {
            return res.status(404).json({ message: 'Fractal not found' });
        }

        if (fractal.user.toString() !== req.user) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        await fractal.deleteOne();
        res.status(200).json({ message: 'Fractal deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting fractal', error });
    }
};



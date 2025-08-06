import express from 'express';
import Tag from '../models/Tag';

const router = express.Router();

// Get all tags
router.get('/', async (_, res) => {
  const tags = await Tag.find();
  res.json(tags);
});

// Create a new tag
router.post('/', async (req, res) => {
  const { label, key, colour } = req.body;

  try {
    const newTag = await Tag.create({ label, key, colour });
    res.status(201).json(newTag);
  } catch (err) {
    res.status(400).json({ message: 'Failed to create tag', error: err });
  }
});

// Update a tag
router.put('/:id', async (req, res) => {
  let { label, key, colour, group } = req.body;
  if (!group || group.trim() === '') {
    group = 'Ungrouped';
  }

  try {
    const updatedTag = await Tag.findByIdAndUpdate(
      req.params.id,
      { label, key, colour, group },
      { new: true }
    );

    res.json(updatedTag);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update tag', error: err });
  }
});

// Delete a tag
router.delete('/:id', async (req, res) => {
  try {
    await Tag.findByIdAndDelete(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ message: 'Failed to delete tag', error: err });
  }
});

export default router;

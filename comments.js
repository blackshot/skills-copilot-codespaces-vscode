// Create web server

// Import modules
const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');

// Import models
const Comment = require('../models/Comment');
const User = require('../models/User');
const Post = require('../models/Post');

// Import middleware
const auth = require('../middleware/auth');

// @route   POST api/comments
// @desc    Create a comment
// @access  Private

router.post(
    '/',
    [
        auth,
        [
        check('text', 'Text is required').not().isEmpty(),
        check('post', 'Post is required').not().isEmpty(),
        ],
    ],
    async (req, res) => {
        // Check for errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
        // Return errors
        return res.status(400).json({ errors: errors.array() });
        }
    
        try {
        // Get user
        const user = await User.findById(req.user.id).select('-password');
    
        // Get post
        const post = await Post.findById(req.body.post);
    
        // Create comment
        const comment = new Comment({
            text: req.body.text,
            user: req.user.id,
            post: req.body.post,
            name: user.name,
            avatar: user.avatar,
        });
    
        // Save comment
        await comment.save();
    
        // Add comment to post
        post.comments.push(comment);
    
        // Save post
        await post.save();
    
        // Return comment
        res.json(comment);
        } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
        }
    }
    );

// @route   GET api/comments
// @desc    Get all comments
// @access  Private

router.get('/', auth, async (req, res) => {
    try {
        // Get comments
        const comments = await Comment.find().sort({ date: -1 });

        // Return comments
        res.json(comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/comments/:id
// @desc    Get comment by ID
// @access  Private

router.get('/:id', auth, async (req, res) => {
    try {
        // Get comment
        const comment = await Comment.findById(req.params.id);

        // Check if comment exists
        if (!comment) {
        return res.status(404).json({ msg: 'Comment not found' });
        }

        // Return comment
        res.json(comment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/comments/:id
// @desc    Update comment
// @access  Private

router.put('/:id', auth, async (req, res) => {
    try {
        // Get comment
        const comment = await Comment.findById(req.params.id);

        // Check if comment exists
        if (!comment) {
        return res.status(404).json({ msg: 'Comment not found' });
        }

        // Check if user owns comment
        if (comment.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
        }

        // Update comment
        comment.text = req.body.text;

        // Save comment
        await comment.save();

        // Return comment
        res.json(comment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE api/comments/:id
// @desc    Delete comment
// @access  Private

router.delete('/:id', auth, async (req, res) => {
    try {
        // Get comment
        const comment = await Comment.findById(req.params.id);

        // Check if comment exists
        if (!comment) {
        return res.status(404).json({ msg: 'Comment not found' });
        }

        // Check if user owns comment
        if (comment.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
        }

        // Delete comment
        await comment.remove();

        // Return message
        res.json({ msg: 'Comment removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT api/comments/like/:id
// @desc    Like a comment
// @access  Private

router.put('/like/:id', auth, async (req, res) => {
    try {
        // Get comment
        const comment = await Comment.findById(req.params.id);

        // Check if comment has already been liked
        if (
        comment.likes.filter((like) => like.user.toString() === req.user.id)
            .length > 0
        ) {
        return res.status(400).json({ msg: 'Comment already liked' });
        }

        // Add like to comment
        comment.likes.unshift({ user: req.user.id });

        // Save comment
        await comment.save();

        // Return likes
        res.json(comment.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

export default router;
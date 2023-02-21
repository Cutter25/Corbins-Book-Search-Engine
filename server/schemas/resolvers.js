const { User, Book } = require('../models');
const { AuthenticationError } = require('apollo-server-express');
const { signToken } = require('../utils/auth');

const resolvers = {
    Query: {
        me: async (parent, args, context) => {
            if (context.user) {
                const userData = await User.findOne({})
                .select('-__v -password')
                .populate('savedBooks')
            
                return userData;
            }
            throw new AuthenticationError('You are currently not logged in');
        }
    },
    
    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);

            return { token, user };
        },

        login: async (parent, { email, password}) => {
            const user = await User.findOne({ email });
            if(!user) {
                throw new AuthenticationError('Incorrect email or password!');
            }
            const correctPassword = await user.isCorrectPassword(password);
            if(!correctPassword) {
                throw new AuthenticationError('Incorrect email or password!')
            }
            const token = signToken(user);
            return { token, user };
        },
        
        saveBook: async (parent, { Book }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    { _id: context.user._id },
                    { $addToSet: {savedBooks: Book} },
                    { new: true },
                );
                
                return updatedUser;
            }
            throw new AuthenticationError('Login to save this book')
        },

        removeBook: async (parent, { bookId }, context) => {
            if (context.user) {
                const updatedUser = await User.findOneAndUpdate(
                    {_id: context.user._id},
                    { $pull: { savedBooks: { bookId: bookId } } },
                    { new: true }
                )
                return updatedUser;
            };
        }
    }
};

module.exports = resolvers;
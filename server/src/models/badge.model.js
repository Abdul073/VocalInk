const mongoose = require('mongoose');
const crypto = require('crypto');

// Enhanced badge schema with industry-level features
const badgeSchema = new mongoose.Schema(
  {
    // Core identification
    badgeKey: { 
      type: String, 
      required: true, 
      unique: true,
      index: true,
      validate: {
        validator: function(v) {
          return /^[a-z0-9_-]+$/.test(v);
        },
        message: 'Badge key must contain only lowercase letters, numbers, hyphens, and underscores'
      }
    },
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    longDescription: { type: String },
    
    // Visual assets
    icon: { type: String, required: true },
    iconDark: { type: String }, // Dark theme icon
    color: { type: String, default: '#3B82F6' },
    backgroundColor: { type: String, default: '#EFF6FF' },
    gradient: { type: String }, // CSS gradient for premium badges
    
    // Categorization and classification
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'],
      default: 'common',
      index: true
    },
    category: {
      type: String,
      enum: ['engagement', 'content', 'social', 'achievement', 'special', 'seasonal', 'community', 'expertise'],
      default: 'achievement',
      index: true
    },
    subcategories: [{ type: String }],
    tags: [{ type: String }],
    themes: [{ type: String }],
    
    // Advanced requirements system
    requirements: {
      // Legacy simple requirements (for backward compatibility)
      xpRequired: { type: Number, default: 0 },
      blogsRequired: { type: Number, default: 0 },
      followersRequired: { type: Number, default: 0 },
      likesRequired: { type: Number, default: 0 },
      commentsRequired: { type: Number, default: 0 },
      daysActiveRequired: { type: Number, default: 0 },
      
      // Advanced logical expression system
      logicalExpression: {
        type: String,
        validate: {
          validator: function(v) {
            if (!v) return true; // Optional field
            try {
              // Basic validation for logical expression format
              const validOperators = ['AND', 'OR', 'NOT', 'GT', 'LT', 'EQ', 'GTE', 'LTE', 'IN', 'NOT_IN'];
              const expression = v.toUpperCase();
              return validOperators.some(op => expression.includes(op)) || 
                     /^[A-Z_][A-Z0-9_]*$/.test(v); // Simple variable reference
            } catch (e) {
              return false;
            }
          },
          message: 'Invalid logical expression format'
        }
      },
      
      // Requirement variables and their definitions
      variables: {
        type: Map,
        of: {
          type: { type: String, enum: ['count', 'sum', 'average', 'boolean', 'date', 'string'] },
          source: { type: String, enum: ['user', 'blog', 'comment', 'series', 'interaction', 'system'] },
          field: { type: String },
          filter: { type: mongoose.Schema.Types.Mixed },
          aggregation: { type: String, enum: ['count', 'sum', 'avg', 'min', 'max', 'distinct'] },
          timeWindow: { type: Number }, // in days
          minimumValue: { type: Number },
          maximumValue: { type: Number }
        }
      },
      
      // Prerequisites and dependencies
      prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
      unlocks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
      
      // Time-based constraints
      availableFrom: { type: Date },
      availableUntil: { type: Date },
      seasonalStart: { type: String }, // e.g., "12-01" for December 1st
      seasonalEnd: { type: String },
      
      // Geographic restrictions
      geographicRestrictions: {
        countries: [{ type: String }],
        regions: [{ type: String }],
        excludeCountries: [{ type: String }]
      },
      
      // User cohort targeting
      userCohorts: {
        newUsers: { type: Boolean, default: false },
        veteranUsers: { type: Boolean, default: false },
        premiumUsers: { type: Boolean, default: false },
        betaTesters: { type: Boolean, default: false }
      }
    },
    
    // Rewards and benefits
    rewards: {
      xpReward: { type: Number, default: 10 },
      featureUnlocks: [{ type: String }],
      specialPrivileges: [{ type: String }],
      customEmojis: [{ type: String }],
      profileBadges: [{ type: String }],
      exclusiveContent: [{ type: String }]
    },
    
    // Visibility and display settings
    visibility: {
      isPublic: { type: Boolean, default: true },
      showInLeaderboard: { type: Boolean, default: true },
      allowSocialSharing: { type: Boolean, default: true },
      showProgress: { type: Boolean, default: true },
      isSecret: { type: Boolean, default: false },
      revealOnEarn: { type: Boolean, default: false }
    },
    
    // Lifecycle management
    status: {
      type: String,
      enum: ['active', 'inactive', 'deprecated', 'archived'],
      default: 'active',
      index: true
    },
    version: { type: String, default: '1.0.0' },
    deprecatedAt: { type: Date },
    archivedAt: { type: Date },
    
    // Performance and analytics
    analytics: {
      totalEarned: { type: Number, default: 0 },
      totalAttempts: { type: Number, default: 0 },
      successRate: { type: Number, default: 0 },
      averageTimeToEarn: { type: Number }, // in days
      lastEarnedAt: { type: Date },
      popularityScore: { type: Number, default: 0 }
    },
    
    // Security and fraud prevention
    security: {
      requiresVerification: { type: Boolean, default: false },
      maxClaimsPerUser: { type: Number, default: 1 },
      cooldownPeriod: { type: Number, default: 0 }, // in seconds
      fraudThreshold: { type: Number, default: 0.8 }, // 0-1 scale
      manualReviewRequired: { type: Boolean, default: false }
    },
    
    // Metadata and tracking
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastModifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: mongoose.Schema.Types.Mixed },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
badgeSchema.index({ badgeKey: 1 });
badgeSchema.index({ category: 1, rarity: 1 });
badgeSchema.index({ status: 1, isActive: 1 });
badgeSchema.index({ 'analytics.totalEarned': -1 });
badgeSchema.index({ 'analytics.popularityScore': -1 });
badgeSchema.index({ createdAt: -1 });

// Virtual for total users who have earned this badge
badgeSchema.virtual('earnedCount').get(function () {
  return this.analytics.totalEarned;
});

// Virtual for active status
badgeSchema.virtual('isActive').get(function () {
  return this.status === 'active';
});

// Pre-save middleware for validation and updates
badgeSchema.pre('save', function(next) {
  // Update analytics if needed
  if (this.isModified('analytics.totalEarned') && this.analytics.totalEarned > 0) {
    this.analytics.lastEarnedAt = new Date();
  }
  
  // Update popularity score
  this.updatePopularityScore();
  
  next();
});

// Instance methods
badgeSchema.methods.updatePopularityScore = function() {
  const earnedWeight = 0.6;
  const attemptsWeight = 0.3;
  const recencyWeight = 0.1;
  
  const earnedScore = Math.min(this.analytics.totalEarned / 1000, 1) * earnedWeight;
  const attemptsScore = Math.min(this.analytics.totalAttempts / 5000, 1) * attemptsWeight;
  
  let recencyScore = 0;
  if (this.analytics.lastEarnedAt) {
    const daysSinceLastEarned = (Date.now() - this.analytics.lastEarnedAt) / (1000 * 60 * 60 * 24);
    recencyScore = Math.max(0, 1 - (daysSinceLastEarned / 365)) * recencyWeight;
  }
  
  this.analytics.popularityScore = earnedScore + attemptsScore + recencyScore;
};

badgeSchema.methods.isAvailableForUser = function(user) {
  // Check status
  if (this.status !== 'active') return false;
  
  // Check time-based availability
  const now = new Date();
  if (this.requirements.availableFrom && now < this.requirements.availableFrom) return false;
  if (this.requirements.availableUntil && now > this.requirements.availableUntil) return false;
  
  // Check seasonal availability
  if (this.requirements.seasonalStart && this.requirements.seasonalEnd) {
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const currentDate = `${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
    
    const startDate = this.requirements.seasonalStart;
    const endDate = this.requirements.seasonalEnd;
    
    if (startDate <= endDate) {
      if (currentDate < startDate || currentDate > endDate) return false;
    } else {
      // Handles year wrap-around (e.g., December to January)
      if (currentDate < startDate && currentDate > endDate) return false;
    }
  }
  
  // Check geographic restrictions
  if (user.location && this.requirements.geographicRestrictions) {
    const userCountry = user.location.country;
    if (this.requirements.geographicRestrictions.excludeCountries.includes(userCountry)) {
      return false;
    }
    if (this.requirements.geographicRestrictions.countries.length > 0 &&
        !this.requirements.geographicRestrictions.countries.includes(userCountry)) {
      return false;
    }
  }
  
  // Check user cohort requirements
  if (this.requirements.userCohorts) {
    const userCreatedAt = user.createdAt;
    const daysSinceCreation = (Date.now() - userCreatedAt) / (1000 * 60 * 60 * 24);
    
    if (this.requirements.userCohorts.newUsers && daysSinceCreation > 30) return false;
    if (this.requirements.userCohorts.veteranUsers && daysSinceCreation < 365) return false;
    if (this.requirements.userCohorts.premiumUsers && !user.isPremium) return false;
    if (this.requirements.userCohorts.betaTesters && !user.isBetaTester) return false;
  }
  
  return true;
};

// Static methods
badgeSchema.statics.getByCategory = function (category) {
  return this.find({ category, status: 'active' }).sort({ rarity: 1, name: 1 });
};

badgeSchema.statics.getActive = function () {
  return this.find({ status: 'active' }).sort({ rarity: 1, name: 1 });
};

badgeSchema.statics.getPopular = function (limit = 10) {
  return this.find({ status: 'active' })
    .sort({ 'analytics.popularityScore': -1 })
    .limit(limit);
};

badgeSchema.statics.getRare = function (limit = 10) {
  return this.find({ 
    status: 'active',
    rarity: { $in: ['rare', 'epic', 'legendary', 'mythic'] }
  })
    .sort({ rarity: 1, 'analytics.totalEarned': 1 })
    .limit(limit);
};

// Enhanced eligibility checking with advanced requirements
badgeSchema.statics.checkUserEligibility = async function (userId) {
  const user = await this.model('User').findById(userId);
  if (!user) return [];
  
  const badges = await this.find({ status: 'active' });
  const eligibleBadges = [];

  for (const badge of badges) {
    if (await this.isUserEligibleForBadge(user, badge)) {
      eligibleBadges.push(badge);
    }
  }

  return eligibleBadges;
};

// Enhanced eligibility checking with advanced requirements system
badgeSchema.statics.isUserEligibleForBadge = async function (user, badge) {
  // Skip if user already has this badge
  if (user.badges.includes(badge._id)) {
    return false;
  }

  // Check availability for user
  if (!badge.isAvailableForUser(user)) {
    return false;
  }

  // Check prerequisites
  if (badge.requirements.prerequisites && badge.requirements.prerequisites.length > 0) {
    for (const prereqId of badge.requirements.prerequisites) {
      if (!user.badges.includes(prereqId)) {
        return false;
      }
    }
  }

  // Use advanced logical expression if available
  if (badge.requirements.logicalExpression) {
    return await this.evaluateLogicalExpression(user, badge);
  }

  // Fall back to legacy simple requirements
  return await this.evaluateLegacyRequirements(user, badge);
};

// Evaluate advanced logical expressions
badgeSchema.statics.evaluateLogicalExpression = async function (user, badge) {
  try {
    const expression = badge.requirements.logicalExpression;
    const variables = badge.requirements.variables;
    
    // This is a simplified implementation - in production, you'd want a more robust expression evaluator
    const context = {};
    
    // Evaluate all variables
    for (const [varName, varDef] of variables) {
      context[varName] = await this.evaluateVariable(user, varDef);
    }
    
    // Simple expression evaluation (in production, use a proper expression parser)
    return this.simpleExpressionEvaluator(expression, context);
  } catch (error) {
    console.error('Error evaluating logical expression:', error);
    return false;
  }
};

// Evaluate individual variables
badgeSchema.statics.evaluateVariable = async function (user, varDef) {
  const { type, source, field, filter, aggregation, timeWindow } = varDef;
  
  let query = {};
  
  // Add user filter
  if (source === 'user') {
    query.user = user._id;
  } else if (source === 'blog') {
    query.author = user._id;
  } else if (source === 'comment') {
    query.author = user._id;
  }
  
  // Add time window filter
  if (timeWindow) {
    const cutoffDate = new Date(Date.now() - (timeWindow * 24 * 60 * 60 * 1000));
    query.createdAt = { $gte: cutoffDate };
  }
  
  // Add custom filters
  if (filter) {
    Object.assign(query, filter);
  }
  
  // Determine collection based on source
  let collection;
  switch (source) {
    case 'user':
      return user[field] || 0;
    case 'blog':
      collection = this.model('Blog');
      break;
    case 'comment':
      collection = this.model('Comment');
      break;
    case 'series':
      collection = this.model('Series');
      break;
    default:
      return 0;
  }
  
  // Perform aggregation
  if (aggregation === 'count') {
    return await collection.countDocuments(query);
  } else if (aggregation === 'sum') {
    const result = await collection.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: `$${field}` } } }
    ]);
    return result[0]?.total || 0;
  } else if (aggregation === 'avg') {
    const result = await collection.aggregate([
      { $match: query },
      { $group: { _id: null, average: { $avg: `$${field}` } } }
    ]);
    return result[0]?.average || 0;
  }
  
  return 0;
};

// Simple expression evaluator (basic implementation)
badgeSchema.statics.simpleExpressionEvaluator = function (expression, context) {
  // This is a very basic implementation
  // In production, use a proper expression parser like mathjs or similar
  try {
    // Replace variables with their values
    let evalExpression = expression;
    for (const [varName, value] of Object.entries(context)) {
      evalExpression = evalExpression.replace(new RegExp(varName, 'g'), value);
    }
    
    // Basic safety check - only allow simple comparisons
    if (!/^[0-9+\-*/().<>=!&\| ]+$/.test(evalExpression)) {
      return false;
    }
    
    return eval(evalExpression);
  } catch (error) {
    console.error('Error evaluating expression:', error);
    return false;
  }
};

// Legacy requirements evaluation (for backward compatibility)
badgeSchema.statics.evaluateLegacyRequirements = async function (user, badge) {
  const requirements = badge.requirements;

  // Check XP requirement
  if (user.xp < requirements.xpRequired) {
    return false;
  }

  // Check blogs requirement
  const blogCount = await this.model('Blog').countDocuments({
    author: user._id,
    status: 'published',
  });
  if (blogCount < requirements.blogsRequired) {
    return false;
  }

  // Check followers requirement
  if (user.followers.length < requirements.followersRequired) {
    return false;
  }

  // Check likes requirement
  if (user.totalLikes < requirements.likesRequired) {
    return false;
  }

  // Check comments requirement
  if (user.totalComments < requirements.commentsRequired) {
    return false;
  }

  // Check days active requirement
  const daysActive = Math.floor(
    (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)
  );
  if (daysActive < requirements.daysActiveRequired) {
    return false;
  }

  return true;
};

// Analytics methods
badgeSchema.statics.updateAnalytics = async function (badgeId, action, metadata = {}) {
  const update = {};
  
  if (action === 'earned') {
    update.$inc = { 'analytics.totalEarned': 1 };
    update.$set = { 'analytics.lastEarnedAt': new Date() };
  } else if (action === 'attempted') {
    update.$inc = { 'analytics.totalAttempts': 1 };
  }
  
  if (Object.keys(update).length > 0) {
    await this.findByIdAndUpdate(badgeId, update);
  }
};

// Security methods
badgeSchema.statics.generateBadgeHash = function (badgeId, userId, timestamp) {
  const secret = process.env.BADGE_SECRET || 'default-secret';
  const data = `${badgeId}-${userId}-${timestamp}-${secret}`;
  return crypto.createHash('sha256').update(data).digest('hex');
};

module.exports = mongoose.model('Badge', badgeSchema);

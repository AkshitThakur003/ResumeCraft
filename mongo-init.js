// MongoDB initialization script
db = db.getSiblingDB('resumecraft');

// Create collections
db.createCollection('users');
db.createCollection('resumes');
db.createCollection('jobs');
db.createCollection('notes');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

db.resumes.createIndex({ user: 1, createdAt: -1 });
db.resumes.createIndex({ user: 1, isActive: 1 });
db.resumes.createIndex({ 'analysis.overallScore': -1 });

db.jobs.createIndex({ user: 1, createdAt: -1 });
db.jobs.createIndex({ user: 1, status: 1 });
db.jobs.createIndex({ user: 1, appliedDate: -1 });
db.jobs.createIndex({ user: 1, isArchived: 1 });

db.notes.createIndex({ user: 1, createdAt: -1 });
db.notes.createIndex({ user: 1, category: 1 });
db.notes.createIndex({ user: 1, isPinned: -1 });
db.notes.createIndex({ user: 1, isArchived: 1 });

print('ResumeCraft database initialized successfully!');

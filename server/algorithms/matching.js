const natural = require('natural');

class MatchingAlgorithm {
  constructor() {
    this.TfIdf = natural.TfIdf;
    this.stemmer = natural.PorterStemmer;
  }

  // 计算两个用户的匹配分数
  calculateMatchScore(user1, user2) {
    let totalScore = 0;
    let weights = {
      researchInterests: 0.4,
      skills: 0.25,
      experience: 0.15,
      location: 0.1,
      collaboration: 0.1
    };

    // 1. 研究兴趣相似度
    const interestScore = this.calculateResearchInterestSimilarity(
      user1.researchInterests, 
      user2.researchInterests
    );
    totalScore += interestScore * weights.researchInterests;

    // 2. 技能互补性
    const skillScore = this.calculateSkillComplementarity(
      user1.skills, 
      user2.skills
    );
    totalScore += skillScore * weights.skills;

    // 3. 经验水平匹配
    const experienceScore = this.calculateExperienceCompatibility(
      user1.education, 
      user2.education
    );
    totalScore += experienceScore * weights.experience;

    // 4. 地理位置偏好
    const locationScore = this.calculateLocationCompatibility(
      user1.profile?.location, 
      user2.profile?.location,
      user1.preferences?.maxDistance || 1000
    );
    totalScore += locationScore * weights.location;

    // 5. 合作类型匹配
    const collaborationScore = this.calculateCollaborationCompatibility(
      user1.preferences?.collaborationType || [],
      user2.preferences?.collaborationType || []
    );
    totalScore += collaborationScore * weights.collaboration;

    // 6. 添加个性化因子，确保每个用户匹配度不同
    const personalityFactor = this.calculatePersonalityFactor(user1, user2);
    totalScore += personalityFactor * 0.05; // 5%的个性化权重

    // 7. 添加轻微随机因子，避免完全相同的分数
    const user1Id = user1._id ? user1._id.toString() : user1.id ? user1.id.toString() : 'default1';
    const user2Id = user2._id ? user2._id.toString() : user2.id ? user2.id.toString() : 'default2';
    const randomFactor = (Math.sin(user1Id.charCodeAt(0) + user2Id.charCodeAt(0)) + 1) / 2;
    totalScore += randomFactor * 0.03; // 3%的随机权重

    // 确保分数在合理范围内
    totalScore = Math.max(0.1, Math.min(1.0, totalScore));
    
    return Math.round(totalScore * 100); // 返回0-100的分数
  }

  // 计算研究兴趣相似度
  calculateResearchInterestSimilarity(interests1, interests2) {
    if (!interests1?.length || !interests2?.length) return 0;

    let maxSimilarity = 0;
    
    interests1.forEach(interest1 => {
      interests2.forEach(interest2 => {
        // 领域匹配
        let fieldSimilarity = 0;
        if (interest1.field === interest2.field) {
          fieldSimilarity = 1;
        } else if (this.isRelatedField(interest1.field, interest2.field)) {
          fieldSimilarity = 0.7;
        }

        // 关键词相似度
        const keywordSimilarity = this.calculateKeywordSimilarity(
          interest1.keywords || [],
          interest2.keywords || []
        );

        // 综合相似度
        const similarity = (fieldSimilarity * 0.6) + (keywordSimilarity * 0.4);
        maxSimilarity = Math.max(maxSimilarity, similarity);
      });
    });

    return maxSimilarity;
  }

  // 计算技能互补性
  calculateSkillComplementarity(skills1, skills2) {
    if (!skills1?.length || !skills2?.length) return 0;

    let complementarityScore = 0;
    let overlapScore = 0;
    let totalComparisons = 0;

    skills1.forEach(skill1 => {
      skills2.forEach(skill2 => {
        totalComparisons++;
        
        if (skill1.name === skill2.name) {
          // 相同技能，检查水平差异（互补性）
          const levelDiff = Math.abs(
            this.getLevelValue(skill1.level) - this.getLevelValue(skill2.level)
          );
          if (levelDiff === 1) {
            complementarityScore += 0.8; // 相邻水平，很好的互补
          } else if (levelDiff === 2) {
            complementarityScore += 0.6; // 有一定互补性
          } else if (levelDiff === 0) {
            overlapScore += 0.5; // 相同水平，有合作基础
          }
        } else if (this.isComplementarySkill(skill1.name, skill2.name)) {
          // 不同但互补的技能
          complementarityScore += 0.7;
        }
      });
    });

    if (totalComparisons === 0) return 0;
    return (complementarityScore + overlapScore) / totalComparisons;
  }

  // 计算经验水平兼容性
  calculateExperienceCompatibility(education1, education2) {
    if (!education1?.length || !education2?.length) return 0.5;

    const level1 = this.getEducationLevel(education1);
    const level2 = this.getEducationLevel(education2);
    
    const levelDiff = Math.abs(level1 - level2);
    
    if (levelDiff === 0) return 1; // 相同水平
    if (levelDiff === 1) return 0.8; // 相邻水平
    if (levelDiff === 2) return 0.6; // 有一定差距
    return 0.3; // 差距较大
  }

  // 计算地理位置兼容性
  calculateLocationCompatibility(location1, location2, maxDistance) {
    if (!location1?.coordinates || !location2?.coordinates) {
      return 0.5; // 位置信息不完整，给中等分数
    }

    const distance = this.calculateDistance(
      location1.coordinates.lat,
      location1.coordinates.lng,
      location2.coordinates.lat,
      location2.coordinates.lng
    );

    if (distance <= maxDistance * 0.1) return 1; // 很近
    if (distance <= maxDistance * 0.3) return 0.8; // 较近
    if (distance <= maxDistance * 0.6) return 0.6; // 中等距离
    if (distance <= maxDistance) return 0.4; // 在接受范围内
    return 0.1; // 太远
  }

  // 计算合作类型兼容性
  calculateCollaborationCompatibility(types1, types2) {
    if (!types1.length || !types2.length) return 0.5;

    const intersection = types1.filter(type => types2.includes(type));
    const union = [...new Set([...types1, ...types2])];
    
    return intersection.length / union.length; // Jaccard相似度
  }

  // 辅助方法
  calculateKeywordSimilarity(keywords1, keywords2) {
    if (!keywords1.length || !keywords2.length) return 0;

    const tfidf = new this.TfIdf();
    tfidf.addDocument(keywords1.join(' '));
    tfidf.addDocument(keywords2.join(' '));

    // 计算余弦相似度
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    const allTerms = new Set([...keywords1, ...keywords2]);
    
    allTerms.forEach(term => {
      const score1 = tfidf.tfidf(term, 0);
      const score2 = tfidf.tfidf(term, 1);
      
      dotProduct += score1 * score2;
      norm1 += score1 * score1;
      norm2 += score2 * score2;
    });

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  isRelatedField(field1, field2) {
    const relatedFields = {
      'computer-science': ['artificial-intelligence', 'data-science', 'software-engineering'],
      'biology': ['bioinformatics', 'genetics', 'molecular-biology'],
      'physics': ['astronomy', 'quantum-physics', 'materials-science'],
      'mathematics': ['statistics', 'applied-mathematics', 'computer-science']
    };

    return relatedFields[field1]?.includes(field2) || 
           relatedFields[field2]?.includes(field1);
  }

  isComplementarySkill(skill1, skill2) {
    const complementaryPairs = {
      'programming': ['data-analysis', 'machine-learning'],
      'writing': ['research', 'presentation'],
      'statistics': ['programming', 'data-visualization'],
      'design': ['programming', 'user-research']
    };

    return complementaryPairs[skill1]?.includes(skill2) ||
           complementaryPairs[skill2]?.includes(skill1);
  }

  getLevelValue(level) {
    const levels = { 'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4 };
    return levels[level] || 2;
  }

  getEducationLevel(education) {
    const degrees = education.map(edu => edu.degree?.toLowerCase() || '');
    if (degrees.some(d => d.includes('phd') || d.includes('doctorate'))) return 4;
    if (degrees.some(d => d.includes('master') || d.includes('ms') || d.includes('ma'))) return 3;
    if (degrees.some(d => d.includes('bachelor') || d.includes('bs') || d.includes('ba'))) return 2;
    return 1;
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // 地球半径（公里）
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI/180);
  }

  // 计算个性化因子
  calculatePersonalityFactor(user1, user2) {
    let personalityScore = 0;
    
    // 基于用户ID的哈希值创建个性化权重
    const user1Id = user1._id ? user1._id.toString() : user1.id ? user1.id.toString() : 'default1';
    const user2Id = user2._id ? user2._id.toString() : user2.id ? user2.id.toString() : 'default2';
    const user1Hash = this.simpleHash(user1Id);
    const user2Hash = this.simpleHash(user2Id);
    
    // 学术级别互补性
    const level1 = this.getAcademicLevel(user1.profile?.title || '');
    const level2 = this.getAcademicLevel(user2.profile?.title || '');
    const levelDiff = Math.abs(level1 - level2);
    
    if (levelDiff === 1) {
      personalityScore += 0.3; // 相邻级别，很好的师生或同级合作
    } else if (levelDiff === 0) {
      personalityScore += 0.2; // 同级别
    } else if (levelDiff === 2) {
      personalityScore += 0.1; // 有一定差距但可以合作
    }
    
    // 院系多样性奖励
    if (user1.profile?.department !== user2.profile?.department) {
      personalityScore += 0.2; // 跨学科合作奖励
    }
    
    // 基于用户特征的个性化调整
    const combinedHash = (user1Hash + user2Hash) % 100;
    personalityScore += (combinedHash / 100) * 0.3; // 0-0.3的个性化调整
    
    return Math.min(1.0, personalityScore);
  }

  // 简单哈希函数
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash);
  }

  // 获取学术级别
  getAcademicLevel(title) {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('教授') || titleLower.includes('professor')) return 4;
    if (titleLower.includes('讲师') || titleLower.includes('lecturer') || titleLower.includes('助理教授')) return 3;
    if (titleLower.includes('博士后') || titleLower.includes('postdoc')) return 2.5;
    if (titleLower.includes('博士') || titleLower.includes('phd')) return 2;
    if (titleLower.includes('硕士') || titleLower.includes('master')) return 1.5;
    if (titleLower.includes('本科') || titleLower.includes('学士') || titleLower.includes('bachelor')) return 1;
    return 1.5; // 默认值
  }
}

module.exports = new MatchingAlgorithm();
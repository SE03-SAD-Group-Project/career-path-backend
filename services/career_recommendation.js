const DEFAULT_OPTIONS = {
  skillWeight: 0.7,
  interestWeight: 0.3,
  topN: 5,
  minScore: 0.01
};

function norm(s) {
  if (!s && s !== 0) return "";
  return String(s).toLowerCase().trim();
}

function buildTokenMap(arr = []) {
  const map = {};
  for (const raw of arr) {
    if (!raw) continue;
    const token = norm(raw);
    if (!token) continue;

    map[token] = (map[token] || 0) + 1;

    const words = token.split(/\W+/).filter(Boolean);
    for (const w of words) {
      map[w] = (map[w] || 0) + 1;
    }
  }
  return map;
}

function tokenOverlapScore(mapA, mapB) {
  if (!mapA || !mapB) return 0;

  const keysA = Object.keys(mapA);
  const keysB = Object.keys(mapB);
  const small = keysA.length <= keysB.length ? keysA : keysB;
  const big = small === keysA ? mapB : mapA;

  let score = 0;
  for (const k of small) {
    if (big[k]) {
      score += (mapA[k] || 0) * (mapB[k] || 0);
    }
  }

  return score;
}

function normalizedScore(mapA, mapB) {
  const raw = tokenOverlapScore(mapA, mapB);
  if (raw === 0) return 0;

  const length = (m) =>
    Math.sqrt(Object.values(m).reduce((s, v) => s + v * v, 0) || 1);

  return raw / (length(mapA) * length(mapB) || 1);
}

function scoreCareer(career, userProfile, options = {}) {
  const opt = Object.assign({}, DEFAULT_OPTIONS, options);

  const careerSkillMap = buildTokenMap(career.requiredSkills || []);
  const careerInterestMap = buildTokenMap(career.relatedInterests || []);

  const userSkillNames = (userProfile.skills || []).map((s) => s.name || s);
  const userInterestNames = userProfile.interests || [];

  const userSkillMap = buildTokenMap(userSkillNames);
  const userInterestMap = buildTokenMap(userInterestNames);

  const skillMatch = normalizedScore(careerSkillMap, userSkillMap);
  const interestMatch = normalizedScore(careerInterestMap, userInterestMap);

  let skillLevelBonus = 0;

  const levelDict = {};
  for (const s of userProfile.skills || []) {
    const name = norm(s.name || s);
    if (!name) continue;

    let lvl = s.level || 0;
    if (lvl > 1) lvl = Math.min(10, lvl) / 10;

    levelDict[name] = lvl;
  }

  let count = 0;
  let accum = 0;

  for (const cs of Object.keys(careerSkillMap)) {
    const userLvl =
      levelDict[cs] ||
      levelDict[cs.toLowerCase()] ||
      0;

    if (userLvl > 0) {
      accum += userLvl;
      count++;
    }
  }

  if (count > 0) {
    skillLevelBonus = (accum / count) * 0.15;
  }

  const combined =
    skillMatch * opt.skillWeight +
    interestMatch * opt.interestWeight +
    skillLevelBonus;

  return {
    title: career.title,
    description: career.description,
    scores: {
      skillMatch,
      interestMatch,
      skillLevelBonus
    },
    combinedScore: Number(combined.toFixed(4))
  };
}

function recommendCareers(careers, userProfile, options = {}) {
  const opt = Object.assign({}, DEFAULT_OPTIONS, options);

  const scored = careers.map((career) =>
    scoreCareer(career, userProfile, opt)
  );

  const filtered = scored
    .filter((c) => c.combinedScore >= opt.minScore)
    .sort((a, b) => b.combinedScore - a.combinedScore)
    .slice(0, opt.topN);

  return filtered;
}

module.exports = {
  recommendCareers
};

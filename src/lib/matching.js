import { supabase } from './supabase';

// Field weights for compatibility scoring
const WEIGHTS = {
  body_type: 3,
  face_type: 3,
  eye_type: 1,
  mbti: 2,
  religion: 3,
  smoking: 4,
  drinking: 2,
  tattoo: 2,
  contact_frequency: 1,
  height: 3,
  age: 3,
  interests: 2,
  personality: 2,
  date_style: 1,
  dating_style: 2,
};

/**
 * Calculate compatibility score between a profile and ideal preferences.
 * Higher = better match. Returns 0-100 normalized score.
 */
export function calculateCompatibility(profile, idealPrefs) {
  let totalWeight = 0;
  let score = 0;

  // Exact match fields (RadioGroup / single value)
  const exactFields = [
    'body_type', 'face_type', 'eye_type', 'mbti', 'religion',
    'smoking', 'drinking', 'tattoo', 'contact_frequency', 'dating_style',
  ];

  for (const field of exactFields) {
    const idealVal = idealPrefs[field];
    if (!idealVal) continue; // null = no preference, skip

    const weight = WEIGHTS[field] || 1;
    totalWeight += weight;

    if (profile[field] === idealVal) {
      score += weight;
    }
  }

  // Age (birth year) range matching
  if (idealPrefs.age_min || idealPrefs.age_max) {
    const weight = WEIGHTS.age;
    totalWeight += weight;

    const birthYear = profile.birth_year;
    if (birthYear) {
      const min = idealPrefs.age_min || 0;
      const max = idealPrefs.age_max || 9999;
      if (birthYear >= min && birthYear <= max) {
        score += weight;
      }
    }
  }

  // Height range matching
  if (idealPrefs.height_min || idealPrefs.height_max) {
    const weight = WEIGHTS.height;
    totalWeight += weight;

    const h = profile.height;
    if (h) {
      const min = idealPrefs.height_min || 0;
      const max = idealPrefs.height_max || 999;
      if (h >= min && h <= max) {
        score += weight;
      }
    }
  }

  // Array overlap fields (CheckboxGroup)
  const arrayFields = ['interests', 'personality', 'date_style'];
  for (const field of arrayFields) {
    const idealArr = idealPrefs[field] || [];
    const profileArr = profile[field] || [];
    if (idealArr.length === 0) continue; // no preference

    const weight = WEIGHTS[field] || 1;
    totalWeight += weight;

    const overlap = idealArr.filter((v) => profileArr.includes(v)).length;
    if (idealArr.length > 0) {
      score += weight * (overlap / idealArr.length);
    }
  }

  if (totalWeight === 0) return 50; // no preferences = neutral
  return Math.round((score / totalWeight) * 100);
}

/**
 * Gale-Shapley stable matching algorithm.
 * @param {Object} malePrefs - { maleId: [femaleId ordered by preference] }
 * @param {Object} femalePrefs - { femaleId: [maleId ordered by preference] }
 * @returns {Array} - [{ male, female }]
 */
export function galeShapley(malePrefs, femalePrefs) {
  const maleIds = Object.keys(malePrefs);
  const femaleIds = Object.keys(femalePrefs);

  // Build female ranking maps for O(1) comparison
  const femaleRanking = {};
  for (const fId of femaleIds) {
    femaleRanking[fId] = {};
    femalePrefs[fId].forEach((mId, index) => {
      femaleRanking[fId][mId] = index;
    });
  }

  // Track proposals: which index each male has proposed up to
  const proposalIndex = {};
  maleIds.forEach((mId) => { proposalIndex[mId] = 0; });

  // Current engagements
  const femalePartner = {}; // femaleId -> maleId
  const malePartner = {};   // maleId -> femaleId

  // Free males queue
  const freeMales = [...maleIds];

  while (freeMales.length > 0) {
    const maleId = freeMales[0];
    const prefList = malePrefs[maleId];

    // If this male has proposed to everyone, remove from queue
    if (proposalIndex[maleId] >= prefList.length) {
      freeMales.shift();
      continue;
    }

    const femaleId = prefList[proposalIndex[maleId]];
    proposalIndex[maleId]++;

    if (!femalePartner[femaleId]) {
      // Female is free → engage
      femalePartner[femaleId] = maleId;
      malePartner[maleId] = femaleId;
      freeMales.shift();
    } else {
      const currentMale = femalePartner[femaleId];
      const ranking = femaleRanking[femaleId];

      // Female prefers new male if his rank is lower (earlier in preference list)
      if ((ranking[maleId] ?? Infinity) < (ranking[currentMale] ?? Infinity)) {
        // Replace
        femalePartner[femaleId] = maleId;
        malePartner[maleId] = femaleId;
        delete malePartner[currentMale];
        freeMales.shift();
        freeMales.push(currentMale); // current male becomes free
      }
      // else: rejected, male stays free and will propose to next
    }
  }

  // Build result
  const result = [];
  for (const [femaleId, maleId] of Object.entries(femalePartner)) {
    result.push({ male: maleId, female: femaleId });
  }

  return result;
}

/**
 * Create a chat room for a matched couple + admin.
 */
export async function createChatRoom(eventId, match, coupleNumber) {
  // 1. Create room
  const { data: room, error: roomError } = await supabase
    .from('chat_rooms')
    .insert({
      event_id: eventId,
      match_id: match.id,
      name: `커플 #${coupleNumber} 채팅방`,
      status: 'active',
    })
    .select()
    .single();

  if (roomError || !room) {
    console.error('채팅방 생성 실패:', roomError?.message);
    return;
  }

  // 2. Add participants (male, female, admin)
  const adminUserId = (await supabase.auth.getUser()).data?.user?.id;
  const participants = [
    { room_id: room.id, user_id: match.male_user_id, role: 'member' },
    { room_id: room.id, user_id: match.female_user_id, role: 'member' },
  ];
  if (adminUserId) {
    participants.push({ room_id: room.id, user_id: adminUserId, role: 'admin' });
  }

  await supabase.from('chat_participants').insert(participants);

  // 3. Send system welcome message
  await supabase.from('chat_messages').insert({
    room_id: room.id,
    sender_id: null,
    content: '매칭이 완료되었습니다! 주선자와 함께하는 채팅방입니다. 서로 인사해보세요 :)',
    message_type: 'system',
  });
}

/**
 * Run full matching pipeline for an event.
 * Fetches applications, computes preferences, runs Gale-Shapley, saves results.
 */
export async function runMatching(eventId) {
  // 0. Check event application mode
  const { data: eventData } = await supabase
    .from('matching_events')
    .select('application_mode')
    .eq('id', eventId)
    .single();

  const isSelection = eventData?.application_mode === 'selection';

  // 1. Fetch applications (for selection mode, only approved ones)
  let query = supabase
    .from('applications')
    .select('user_id, profile_snapshot, preferences_snapshot')
    .eq('event_id', eventId);

  if (isSelection) {
    query = query.eq('status', 'approved');
  }

  const { data: applications, error: appError } = await query;

  if (appError) throw new Error('신청 데이터 조회 실패: ' + appError.message);
  if (!applications || applications.length < 2) {
    throw new Error(isSelection
      ? '매칭하려면 최소 2명의 승인된 신청자가 필요합니다.'
      : '매칭하려면 최소 2명의 신청자가 필요합니다.');
  }

  // 2. Separate by gender
  const males = applications.filter((a) => a.profile_snapshot?.gender === '남자');
  const females = applications.filter((a) => a.profile_snapshot?.gender === '여자');

  if (males.length === 0 || females.length === 0) {
    throw new Error('남녀 각각 최소 1명 이상의 신청자가 필요합니다.');
  }

  // 3. Build preference lists using compatibility scores
  const malePrefs = {};
  const femalePrefs = {};
  const scoreMap = {};

  for (const male of males) {
    const maleBlind = male.profile_snapshot?.blind || male.profile_snapshot;
    const maleProfile = { ...maleBlind, birth_year: male.profile_snapshot?.birth_year };
    const maleIdeal = male.preferences_snapshot;

    const scored = females.map((female) => {
      const femaleBlind = female.profile_snapshot?.blind || female.profile_snapshot;
      const femaleProfile = { ...femaleBlind, birth_year: female.profile_snapshot?.birth_year };
      const femaleIdeal = female.preferences_snapshot;

      // Male's preference for this female (how well female matches male's ideal)
      const maleScore = calculateCompatibility(femaleProfile, maleIdeal);
      // Female's preference for this male (how well male matches female's ideal)
      const femaleScore = calculateCompatibility(maleProfile, femaleIdeal);

      const key = `${male.user_id}_${female.user_id}`;
      scoreMap[key] = { maleScore, femaleScore, combined: maleScore + femaleScore };

      return { femaleId: female.user_id, maleScore };
    });

    // Sort by score descending
    scored.sort((a, b) => b.maleScore - a.maleScore);
    malePrefs[male.user_id] = scored.map((s) => s.femaleId);
  }

  for (const female of females) {
    const femaleIdeal = female.preferences_snapshot;

    const scored = males.map((male) => {
      const maleBlind = male.profile_snapshot?.blind || male.profile_snapshot;
      const maleProfile = { ...maleBlind, birth_year: male.profile_snapshot?.birth_year };
      const femaleScore = calculateCompatibility(maleProfile, femaleIdeal);
      return { maleId: male.user_id, femaleScore };
    });

    scored.sort((a, b) => b.femaleScore - a.femaleScore);
    femalePrefs[female.user_id] = scored.map((s) => s.maleId);
  }

  // 4. Run Gale-Shapley
  const matches = galeShapley(malePrefs, femalePrefs);

  // 5. Save results to matches table
  const matchRecords = matches.map(({ male, female }) => {
    const key = `${male}_${female}`;
    const scores = scoreMap[key];
    return {
      event_id: eventId,
      male_user_id: male,
      female_user_id: female,
      compatibility_score: scores ? scores.combined / 2 : 0,
      status: 'matched',
    };
  });

  if (matchRecords.length > 0) {
    const { data: insertedMatches, error: insertError } = await supabase
      .from('matches')
      .insert(matchRecords)
      .select();

    if (insertError) throw new Error('매칭 결과 저장 실패: ' + insertError.message);
  }

  // 6. Update event status to completed
  await supabase
    .from('matching_events')
    .update({ status: 'completed' })
    .eq('id', eventId);

  return matchRecords;
}

module.exports = {
  rooms: require('../handlers/rooms-handler'),
  calls: require('../handlers/calls-handler'),
  memberships: require('../handlers/memberships-handler'),
  transcripts: require('../handlers/transcripts-handler'),
  assistant: require('../handlers/assistant-handler'),
  actions: require('../handlers/admin-handler')
};

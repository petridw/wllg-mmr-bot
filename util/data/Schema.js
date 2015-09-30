var Schema = {
  users: {
    id: { type: "increments", nullable: false, primary: true },
    username: { type: "string", maxlength: 150, nullable: false },
    steamId: { type: "string", maxlength: 150, nullable: false, unique: true },
    mmr: { type: "string", maxlength: 150, nullable: false }
  },
  matches: {
    id: { type: "increments", nullable: false, primary: true },
    result: { type: "string", maxlength: 1, nullable: false }
  }
};

module.exports = Schema;

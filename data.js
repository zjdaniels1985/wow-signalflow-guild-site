/* Edit verified guild information here. Blank fields are intentional, not guild claims. */
(function (root) {
  const division = (label, tagline) => ({
    label, tagline,
    info: { realm: "", faction: "", focus: "", leadership: "", recruitment: "" },
    recruitment: { needs: [], instructions: "", applicationUrl: "", discordUrl: "" },
    schedule: { days: "", serverTime: "", timezone: "", mythicPlus: "" },
    events: [],
    rules: { loot: "", attendance: "" },
    progression: { tier: "", summary: "", verifiedDate: "", logsUrl: "", raiderIoUrl: "" },
    roster: [],
    officers: [],
    loot: { trackerUrl: "", verifiedDate: "", standings: [] },
    messages: []
  });
  const data = {
    guild: {
      name: "Signal Flow",
      tabard: "assets/Signal_Flow_Tabbard.png",
      discordUrl: "",
      contactUrl: ""
    },
    versions: {
      retail: division("Retail", "Your next adventure starts with a good group."),
      classic: division("Classic", "Old adventures. New connections."),
      forever: division("Forever", "A place to gather. A community to call home."),
      tbc: division("TBC", "Gather your party. Step through the portal.")
    },
    community: {
      rulesStatus: "Draft — pending leadership approval",
      rules: [
        "Treat fellow players with respect. No harassment, discrimination, threats, or targeted abuse.",
        "Keep disagreements constructive. Do not shame players for mistakes, experience, or performance.",
        "Respect privacy. Do not share personal information or screenshots of private conversations without consent.",
        "Follow game and platform rules. Do not encourage cheating, scams, or account sharing."
      ],
      reporting: "Suggested process: privately contact a verified officer with the incident details and any relevant evidence. Avoid public callouts. For immediate threats or platform violations, use the platform’s reporting tools. Guild reporting contacts have not yet been configured.",
      news: [],
      discussions: { publicUrl: "", memberUrl: "", discordUrl: "" }
    }
  };
  if (typeof module !== "undefined" && module.exports) module.exports = data;
  else root.SignalFlowData = data;
})(globalThis);

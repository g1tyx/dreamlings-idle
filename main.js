//#region SETUP
const GAME_SAVE_VERSION = 1;

let partyDreamlings=[], trainingDreamlings=[], storageDreamlings=[], ranchDreamling=[], wildQueue=[];
let maxPartySize=10, maxTrainingSize=5, maxStorageSize=500, maxRanchSize=1;
let maxChests=30, energy=30, maxEnergy=30, maxQuestRepeats=5;
let playerLevel=1, playerXP=0, maxPotions=0;
let dreamPoints=0, researchPoints=0, releasedPoints=0, gold=0, questTokens=0;
let eventAccess=null, eventVouchers=0;

const ENERGY_REGEN_INTERVAL = 10 * 60 * 1000; // 10 minutes in ms
const CHEST_REGEN_INTERVAL = 10 * 60 * 1000;
let nextEnergyTimestamp = null;
let nextChestTimestamp = null;
let lastChestRegen = Date.now();

let isImporting = false;
let nextDreamlingId = 1;

let lastSaveTime = null;

const dreamBook = {};
let selectedLetter = "A";
let currentSelectedButton = null;

let fusionSlots = [null, null];

let selectedArea=null, wildDreamling=null, wildInterval=null;
let isTamingInProgress = false;

let ascendedDreamlings = [];
let permanentBoosts = {};

let pendingTrades = []; // Dreamlings waiting to expire
let redeemedQRCodes = [];
let pendingTradeTicker = null;
let pendingTradeTimers = new Map();
const TRADE_EXPIRY_HOURS = 24;

let tutorialFlags = {
    dreamlings: false,
    "wild-areas": false,     // Use exact match with hyphen
    "fusion-lab": false,     // Use exact match with hyphen  
    "dream-book": false,     // Use exact match with hyphen
    ranch: false,
    quests: false,
    shop: false,
    collection: false,
    "trophy-hall": false,    // Use exact match with hyphen
    settings: false,
    help: false
};

// Area unlock levels
const areaUnlockLevels = {
  forest: 0,
  event: 0,
  mountain: 20,
  lake: 40,
  marsh: 60,
  swamp: 80,
  desert: 100,
  volcano: 120,
  city: 140,
  ocean: 160,
  tundra: 180,
  caverns: 200,
  meadow: 220,
  skylands: 240
};

let boostTimerIntervals = {};
let activeTemporaryBoosts = {}; // key = boost name

let boosts = {
    xp: 1,
    dreamPoints: 1,
    researchPoints: 1,
    star: 1,
    critChance: 1,
    gold: 1,
    goldFlat: 0,
    taming: 1,
    energyRegen: 1,
    chestRegen: 1,
    maxEnergy: 0,
    maxChests: 0,
    maxParty: 0,
    maxTraining: 0,
    maxStorage: 0,
    maxQuests: 0
};

let boostLevels = {
    xp: 0,
    dreamPoints: 0,
    researchPoints: 0,
    star: 0,
    critChance: 0,
    gold: 0,
    taming: 0,
    energyRegen: 0,
    chestRegen: 0,
    maxEnergy: 0,
    maxChests: 0,
    maxParty: 0,
    maxTraining: 0,
    maxStorage: 0,
    maxQuests: 0
};

const boostBaseValues = {
    // Percentage boosts (multiplicative)
    xp: 0.01,
    dreamPoints: 0.01,
    researchPoints: 0.01,
    star: 0.01,
    critChance: 0.01,
    gold: 0.01,
    taming: 0.01,
    energyRegen: 0.01,
    chestRegen: 0.01,
    // Flat boosts (additive)
    maxEnergy: 5,
    maxChests: 5,
    maxStorage: 250,
    maxParty: 1,
    maxTraining: 1,
    maxQuests: 1
};

const fusionChances = {
    common: 80,
    uncommon: 70,
    rare: 60,
    epic: 50,
    legendary: 40
};

let ranch = {
  level: 1,
  activeUpgrade: null,
  rooms: {}
};

const globalSeed = 9876543210;
const collectibleRarities = ["common", "uncommon", "rare", "epic", "legendary"];
const chestRarities = ["common", "uncommon", "rare", "epic", "legendary"];
const collectibleValues = {
  common: 0.005,
  uncommon: 0.01,
  rare: 0.015,
  epic: 0.02,
  legendary: 0.025
};

let playerCollectibles = [];
let monthlyEventsAdded = 0;
const monthlyEventCount = 250, startMonth = 9, startYear = 2025;
let chests = []; // chest objects
let pityEventVoucher=0, pityMaxPotion=0;

let dailyQuests = [];
let dailyQuestCount = 5;
let lastQuestReset = 0;

const questDefinitions = [
  { id: "tame_common", desc: "Tame 5 Common Dreamlings", goal: 5, type: "tame", rarity: "common", rewardGold: 100, rewardTokens: 1 },
  { id: "tame_uncommon", desc: "Tame 4 Uncommon Dreamlings", goal: 4, type: "tame", rarity: "uncommon", rewardGold: 150, rewardTokens: 1 },
  { id: "tame_rare", desc: "Tame 3 Rare Dreamlings", goal: 3, type: "tame", rarity: "rare", rewardGold: 200, rewardTokens: 1 },
  { id: "tame_epic", desc: "Tame 2 Epic Dreamlings", goal: 2, type: "tame", rarity: "epic", rewardGold: 250, rewardTokens: 1 },
  { id: "tame_legendary", desc: "Tame 1 Legendary Dreamling", goal: 1, type: "tame", rarity: "legendary", rewardGold: 300, rewardTokens: 1 },
  { id: "register_new", desc: "Register 5 New Dreamlings", goal: 5, type: "register", rewardGold: 250, rewardTokens: 1 },
  { id: "fuse_once", desc: "Successfully Fuse 1 Time", goal: 1, type: "fuse", rewardGold: 250, rewardTokens: 1 },
  { id: "open_chests", desc: "Open 30 Chests", goal: 30, type: "chest", rewardGold: 100, rewardTokens: 1 },
  { id: "event_collectibles", desc: "Find 10 Event Collectibles", goal: 10, type: "event", rewardGold: 100, rewardTokens: 1 },
  { id: "upgrade_ranch", desc: "Buy 1 Upgrade", goal: 1, type: "upgrade", rewardGold: 250, rewardTokens: 1 },
];

const dreamlingFilterState = {
    party: { rarity: null, star: 'all', event: 'all', traded: 'all' },
    training: { rarity: null, star: 'all', event: 'all', traded: 'all' },
    storage: { rarity: null, star: 'all', event: 'all', traded: 'all' },
    ranch: { rarity: null, star: 'all', event: 'all', traded: 'all' }
};

const dreamlingSortState = {
    party: 'species',
    training: 'species',
    storage: 'species',
};

// Section map for getting arrays
const sectionMap = {
    party: () => partyDreamlings,
    training: () => trainingDreamlings,
    storage: () => storageDreamlings,
};

const fusionFilterState = {
    rarity: null,
    star: 'all',
    event: 'all',
    traded: 'all'
};

let fusionSortState = 'species';

const additiveKeys = [
  "maxChests",
  "maxParty",
  "maxTraining",
  "maxStorage",
  "maxEnergy",
  "maxQuests",
  "goldFlat"
];

let furnitureDisplayNames = {}

const roomFurniture = {
    "library": ["bookshelf", "desk", "candle", "scrollRack", "lectern", "inkWell", "quillStand", "rug", "magicalLamp", "globe", "ancientTome", "ladder", "crystalBall", "statue", "chalkboard", "bookshelfSmall"],
    "trainingHall": ["trainingDummy", "banner", "weights", "trainingMat", "punchingBag", "weaponRack", "armorStand", "whistle", "gong", "chalkLine", "bench", "sandbag", "sparringRing", "torch", "floorTiles", "victoryFlag"],
    "kitchen": ["stove", "pantry", "table", "teapot", "cuttingBoard", "spiceRack", "cauldron", "breadOven", "kettle", "dishRack", "plates", "soupPot", "knifeBlock", "vegetableBasket", "cheeseWheel", "wineBottle"],
    "stables": ["hayBale", "waterTrough", "saddleRack", "barnBell", "pitchfork", "horseshoe", "bucket", "lantern", "fence", "groomingKit", "reins", "wheelbarrow", "troughCover", "stallDivider", "blanket", "bellows"],
    "garden": ["flowerPot", "fountain", "tree", "birdhouse", "bench", "hedge", "stonePath", "sundial", "lanternPost", "vines", "wateringCan", "butterflyBush", "gazebo", "statue", "flowerbed", "birdBath"],
    "workshop": ["workbench", "tools", "blueprintRack", "clock", "saw", "hammer", "anvil", "bellows", "cogwheel", "forge", "toolChest", "nails", "pliers", "oilLamp", "pulley", "ruler"],
    "observatory": ["telescope", "globe", "starchart", "hourglass", "astrolabe", "compass", "constellationMap", "lantern", "meteorRock", "spiralStairs", "telescopeStand", "brassMirror", "crystalPrism", "orrery", "armillarySphere", "moonDial"],
    "dormitory": ["bed", "wardrobe", "nightstand", "decoration", "bookshelf", "candleLamp", "carpet", "chair", "dresser", "mirror", "rug", "footlocker", "pillow", "blanket", "chest", "shoeRack"]
};

let isGnomeHome = false;

function gnomeHome() {
  maxStorageSize = 5000;
  isGnomeHome = true;
  renderAllSections();
  saveGame();
  console.log("Gnome magic applied! Max storage is now 5000");
}

// Function to reset taming lock
function resetTamingLock() {
  showConfirm(
    "Are you sure you want to stop all taming processes? If you were taming, your timer will be reset. Use this only if you are locked out of taming.",
    () => {
      // User confirmed
      isTamingInProgress = false;

      // Stop all currently taming wild Dreamlings
      wildQueue.forEach(d => {
        if (d.taming) {
          d.taming = false;
          d.tamingTimer = d.tamingRequired; // optionally reset timer
        }
      });

      showMessage("All taming processes have been stopped.");
      renderWildQueue(); // refresh UI
    },
    () => {
      // User canceled
      showMessage("Taming reset canceled.");
    }
  );
}

document.getElementById("gnome-home-btn").onclick = () => {
    if (isGnomeHome) {
        showMessage("Gnome Home has already been applied!");
        return;
    }

    showConfirm(
        "Are you sure you want to activate Gnome Home?\nThis will upgrade your max storage to 5000 permanently!",
        () => {
            gnomeHome(); // apply the effect
            showMessage("Gnome magic applied! Max storage is now 5000.");
        }
    );
};

document.getElementById("stuck-taming-btn").onclick = resetTamingLock;

//#endregion

//#region SAVE THE GAME
function saveGame() {
    if (isImporting) return;

    const saveData = {
        version: GAME_SAVE_VERSION,
        lastSaveTime: Date.now(),

        partyDreamlings, trainingDreamlings, storageDreamlings, wildQueue, ascendedDreamlings,
        nextDreamlingId, isGnomeHome,
        maxPartySize, maxTrainingSize, maxStorageSize,
        chests, maxChests, energy, maxEnergy, maxQuestRepeats,
        playerLevel, playerXP,
        dreamPoints, researchPoints, gold, questTokens, releasedPoints, maxPotions,
        eventAccess, eventVouchers,
        nextEnergyTimestamp, lastChestRegen, nextChestTimestamp,
        dreamBook,
        selectedLetter,
        selectedArea, 
        isTamingInProgress,
        playerCollectibles: playerCollectibles || [], 
        pityMaxPotion, pityEventVoucher,
        pendingTrades, 
        dailyQuests, lastQuestReset,
        speciesByArea,
        activeTemporaryBoosts,
        boostLevels,
        redeemedQRCodes,
        tutorialFlags: tutorialFlags
    };

    try {
        const jsonString = JSON.stringify(saveData);
        const compressed = LZString.compress(jsonString);
        
        localStorage.setItem("dreamGameSave", compressed);
        
        // Log compression stats
        const originalSize = (jsonString.length / 1024).toFixed(2);
        const compressedSize = (compressed.length / 1024).toFixed(2);
        const ratio = ((compressed.length / jsonString.length) * 100).toFixed(1);        
    } catch (e) {
        console.error('Save failed:', e);
        if (e.name === 'QuotaExceededError') {
            alert('Storage is full! Please download a backup and delete your save to free space.');
        } else {
            alert('Failed to save game!');
        }
    }
}

function loadGame() {
    const saved = localStorage.getItem("dreamGameSave");
    if (!saved) {
        console.log("No save found. Starting new game.");
        giveStarterDreamling();
        return;
    }

    try {
        // Try to decompress first (new format)
        let data;
        try {
            const decompressed = LZString.decompress(saved);
            if (decompressed) {
                data = JSON.parse(decompressed);
                console.log("Loaded compressed save");
            } else {
                // Fall back to uncompressed (old saves)
                data = JSON.parse(saved);
                console.log("Loaded uncompressed save (migrating to compressed format)");
            }
        } catch (decompressError) {
            // If decompression fails, try loading as plain JSON (old format)
            data = JSON.parse(saved);
            console.log("Loaded legacy uncompressed save");
        }

        migrateCollectibleIds(data);
        migrateSpeciesNames(data);
        migrateDuplicateSpecies();

        // Restore variables
        speciesByArea = data.speciesByArea || createSpeciesDistribution(speciesPool, seasonalSpecies);
        
        partyDreamlings = data.partyDreamlings || [];
        trainingDreamlings = data.trainingDreamlings || [];
        storageDreamlings = data.storageDreamlings || [];
        wildQueue = data.wildQueue || [];
        ascendedDreamlings = data.ascendedDreamlings || [];
        nextDreamlingId = data.nextDreamlingId || 1;

        if (!data.cleanedUpDreamlings) {
            partyDreamlings.forEach(cleanupDreamling);
            trainingDreamlings.forEach(cleanupDreamling);
            storageDreamlings.forEach(cleanupDreamling);
            ranchDreamling.forEach(cleanupDreamling);
            
            data.cleanedUpDreamlings = true; // Mark as cleaned
            console.log("Cleaned up unnecessary fields from Dreamlings");
        }

        if (Array.isArray(ascendedDreamlings) && ascendedDreamlings.length > 0) {
          permanentBoosts = {};

          for (const d of ascendedDreamlings) {
            const rarityData = rarities[d.rarity];
            if (!rarityData) continue;

            // Always use level 333 for ascended boost calculation
            const cappedBoost = rarityData.baseBoost + (rarityData.levelBoost * 333);

            for (const bonus of d.bonusBoosts || []) {
              const key = bonus.type;
              permanentBoosts[key] = (permanentBoosts[key] || 0) + cappedBoost;
            }
          }
        }

        boostLevels = {
            xp: 0, dreamPoints: 0, researchPoints: 0, star: 0, critChance: 0,
            gold: 0, taming: 0, energyRegen: 0, chestRegen: 0,
            maxEnergy: 0, maxChests: 0, maxParty: 0, maxTraining: 0,
            maxStorage: 0, maxQuests: 0
        };

        if (data.boostLevels) {
            boostLevels = { ...boostLevels, ...data.boostLevels };
        }

        researchPoints = data.researchPoints ?? 0;
        gold = data.gold ?? 0;

        ranch = data.ranch || [];
        const refundGiven = refundRanchInvestment();

        if (data.ranchDreamling && Array.isArray(data.ranchDreamling) && data.ranchDreamling.length > 0) {
            console.log(`Migrating ${data.ranchDreamling.length} Dreamling from obsolete Ranch to storage`);
            storageDreamlings.push(...data.ranchDreamling);
            data.ranchDreamling = [];
        }

        maxPartySize = data.maxPartySize ?? 10;
        maxTrainingSize = data.maxTrainingSize ?? 5;
        maxStorageSize = data.maxStorageSize ?? 500;

        isGnomeHome = data.isGnomeHome ?? false;

        chests = data.chests ?? [];
        maxChests = data.maxChests ?? 30;
        energy = data.energy ?? 30;
        maxEnergy = data.maxEnergy ?? 30;
        maxQuestRepeats = data.maxQuestRepeats ?? 5;

        playerLevel = data.playerLevel ?? 1;
        playerXP = data.playerXP ?? 0;

        dreamPoints = data.dreamPoints ?? 0;
        questTokens = data.questTokens ?? 0;
        releasedPoints = data.releasedPoints ?? 0;
        maxPotions = data.maxPotions ?? 0;

        eventAccess = data.eventAccess ?? null;
        eventVouchers = data.eventVouchers ?? 0;

        nextEnergyTimestamp = data.nextEnergyTimestamp ?? null;
        nextChestTimestamp = data.nextChestTimestamp ?? null;
        lastChestRegen = data.lastChestRegen || Date.now();

        if (!lastChestRegen) {
          lastChestRegen = Date.now();
        }

        pityEventVoucher = data.pityEventVoucher ?? 0;
        pityMaxPotion = data.pityMaxPotion ?? 0;

        for (const key in dreamBook) delete dreamBook[key];
        Object.assign(dreamBook, data.dreamBook || {});

        selectedLetter = data.selectedLetter ?? "A";
        selectedArea = data.selectedArea ?? "forest";
        isTamingInProgress = data.isTamingInProgress;

        pendingTrades = data.pendingTrades || [];
        redeemedQRCodes = data.redeemedQRCodes || [];

        // Clean up any expired codes on load
        cleanupExpiredQRCodes();

        dailyQuests = data.dailyQuests || [];
        lastQuestReset = data.lastQuestReset || 0;

        activeTemporaryBoosts = data.activeTemporaryBoosts;
        tutorialFlags = data.tutorialFlags || tutorialFlags;

        for (const [key, boost] of Object.entries(activeTemporaryBoosts)) {
            if (boost.expiresAt <= Date.now()) delete activeTemporaryBoosts[key];
        }

        if (dailyQuests.length === 0) {
            initializeDailyQuests();
        }

        ensureUniqueDreamlingIDs();

        nextDreamlingId = Math.max(
          nextDreamlingId,
          ...partyDreamlings.map(d => d.id),
          ...trainingDreamlings.map(d => d.id),
          ...storageDreamlings.map(d => d.id),
          ...(ranchDreamling || []).map(d => d.id)
        ) + 1;

        cleanupDreamlingBonuses();
        fixDreamlingOrder();
        applyBoostUpgrades();
        renderAllSections();

        console.log("Game loaded!");
    } catch (err) {
        console.error("Failed to load save:", err);
        console.log("Starting new game instead.");
        giveStarterDreamling();
    }
}

function deleteSave() {
    showConfirm(
        "Are you sure you want to delete your save? This cannot be undone.",
        () => {
            localStorage.removeItem("dreamGameSave");
            showMessage("Save deleted. The game will now reset.");

            // Reset ALL game variables
            speciesByArea = createSpeciesDistribution(speciesPool, seasonalSpecies);
            partyDreamlings = [];
            trainingDreamlings = [];
            storageDreamlings = [];
            ranchDreamling = [];
            wildQueue = [];
            pendingTrades = [];
            ascendedDreamlings = [];

            chests = [];
            maxChests = 30;
            energy = 30;
            maxEnergy = 30;
            maxQuestRepeats = 5;

            playerLevel = 1;
            playerXP = 0;
            dreamPoints = 0;
            researchPoints = 0;
            gold = 0;
            questTokens = 0;
            releasedPoints = 0;
            maxPotions = 0;

            eventAccess = null;
            eventVouchers = 0;

            nextEnergyTimestamp = null;
            nextChestTimestamp = null;
            lastChestRegen = Date.now();

            for (const key in dreamBook) delete dreamBook[key];

            selectedLetter = "A";
            currentSelectedButton = null;

            selectedArea = "forest";
            wildDreamling = null;
            wildInterval = null;
            isTamingInProgress = false;

            playerCollectibles = [];

            dailyQuests = [];
            lastQuestReset = 0;

            activeTemporaryBoosts = {};

            tutorialFlags = {
                dreamlings: false,
                "wild-areas": false,
                "fusion-lab": false,
                "dream-book": false,
                ranch: false,
                quests: false,
                shop: false,
                collection: false,
                "trophy-hall": false,
                settings: false,
                help: false
            };

            initializeBoostUpgrades();

            giveStarterDreamling();

            initializeDailyQuests();

            renderAllSections();
            renderFusionStorage();
            updateSidebarEventDisplay();
            updatePlayerInfo();
            updateEnergyDisplay();
            renderTrophyHall();

            renderAvailableDreamlings(selectedArea);
            highlightSelectedArea(selectedArea);

            saveGame();
            
            console.log("Game completely reset to fresh state");
        }
    );
}

function exportSave() {
  const saved = localStorage.getItem("dreamGameSave");
  if (!saved) {
    showMessage("No save data found!");
    return;
  }

  // Decompress before exporting (so it's human-readable)
  try {
    const decompressed = LZString.decompress(saved);
    const saveData = decompressed || saved; // Fall back to raw if decompression fails
    
    const blob = new Blob([saveData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dreamlings_save_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Export failed:", e);
    showMessage("Failed to export save!");
  }
}

function isValidSave(data) {
    if (typeof data !== "object" || data === null) return false;

    if (!("version" in data) || typeof data.version !== "number") return false;
    if (data.version > GAME_SAVE_VERSION) {
        showMessage("This save is from a newer game version and may not work!");
        return false;
    }

    const requiredKeys = [
        "partyDreamlings", "trainingDreamlings", "storageDreamlings",
        "playerLevel", "playerXP", "energy", "maxEnergy"
    ];

    for (const key of requiredKeys) {
        if (!(key in data)) return false;
    }

    if (typeof data.playerLevel !== "number" || data.playerLevel < 1) return false;
    if (typeof data.energy !== "number" || data.energy < 0) return false;

    return true;
}

function importSave(file) {
    if (!file) {
        showMessage("No file selected!");
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const rawData = e.target.result;
            const data = JSON.parse(rawData);

            if (!isValidSave(data)) {
                showMessage("Invalid or unsafe save file!");
                document.getElementById('importFile').value = '';
                return;
            }

            isImporting = true;

            // Compress before storing
            const compressed = LZString.compress(JSON.stringify(data));
            localStorage.setItem("dreamGameSave", compressed);
            
            const verify = localStorage.getItem("dreamGameSave");
            console.log("Save stored in localStorage:", verify !== null);
            
            document.getElementById('importFile').value = '';
            
            showMessage("Save imported! Reloading...");
            setTimeout(() => {
                location.reload();
            }, 500);
        } catch (err) {
            console.error("Import failed:", err);
            showMessage("Corrupted or invalid file!");
            document.getElementById('importFile').value = '';
            isImporting = false;
        }
    };
    reader.readAsText(file);
}
//#endregion

//#region TUTORIAL
// Tutorial content for each tab
const tutorialContent = {
  dreamlings: {
    title: "Welcome to Dreamlings Idle!",
    text: "In this tab live your current Dreamlings: your active party, your training Dreamlings and your storage.\n\nParty Dreamlings give bonuses and gain experience every second. The Dreamlings you put in training gain twice the experience, but give no bonuses. The ones in your storage don't gain experience and they don't give bonuses. You start with 500 storage, but you can increase your storage later. Every party member gives you 0.5 experience per second, so try to keep a full party at all times.\n\nExporting creates a QR code (or, if that fails, a regular text code), which you can use to trade with other people. There is not much point in trading with yourself, because beyond a 'TRADED' banner and collection purposes, there are no benefits. The codes are valid for 24h after generation, so you can't just export everything and keep them indefinitely if you run out of storage. You can use the same code once every 24h, but you can use as many codes as you want. If you'd like to trade, check out the Discord link in the Settings tab and join us!",
    position: "center"
  },
  wildAreas: {
    title: "Wild Areas/Star Dreamlings/Event Area", 
    text: "You start with the Forest area, where you can find ~50 random Dreamlings out of the 650 base ones. These are different for everyone. You will need Event Vouchers to temporarily access the Event area, or purchase access from the Token Shop with Quest Tokens. Search for a wild Dreamling, which costs 1 energy, and then click 'tame'. Taming takes some time, depending on the rarity. You can only tame 1 at a time, so choose carefully. Wild Dreamlings will disappear after some time (10-15 minutes), so don't spend all your energy at once unless you plan on leaving for a while and letting it regenerate. Energy regens 1 every 10 minutes and starts off with max 30, but you can increase this.\n\nEvery time you search, you have a 0.5 base chance of encountering a star Dreamling. These are special variants, though really their only benefit is that they have double the max level of their regular variant. You can raise your base star chance with upgrades and Dreamling bonuses, but it's capped at 5% total.\n\nEvery month, 30 new species are added that you can collect for that month only. These are limited edition for now, meaning they aren't set to return afterwards, so get them while you can. If you're aiming to collect all of them, a tip is to collect at least the Common T1's of each and preferably the Uncommon T1's as well, to make things easier on yourself. With the Dream Book and a lot of levelling and fusions and some luck, you will be able to work your way up through every Dreamling species.",
    position: "center"
  },
  fusionLab: {
    title: "Fusion Lab",
    text: "When you have level 25 Dreamlings that have the same rarity and tier, you can fuse them. Upon success you will get a higher tier, a higher rarity or both. The selected Dreamlings will disappear and the result will appear in your storage, starting over at level 1. Failure to fuse will make the Dreamlings tired and mean you will have to wait 30 minutes to try again. You are able to get star Dreamlings from regular fusion. Fusing a star and a regular Dreamling will result in a 50% chance of a star, while fusing two stars will always give another star.",
    position: "center"
  },
  dreamBook: {
    title: "Dream Book",
    text: "Every single Dreamling you have ever collected appears here. You can buy collected Dreamlings for Dream Points. The price depends on the rarity and the tier, and events are three times as expensive. This can help you finish a collection, if that's what you want to work on. The base rate for Dream Points is 1 per second, per party member. You are able to get star Dreamlings from Dream Book purchases.",
    position: "center"
  },
  ranch: {
    title: "Upgrades",
    text: "Buy upgrades with Research Points and Gold. You gain 0.1 Research Point per second from each party member and then 0.1-0.5 Research Points per second from released Dreamlings, depending on the rarity. Once you have accumulated some Dream Points, you could buy cheap Common T1's from the Dream Book for 100k each and release them for 0.1 Research Points per second. Gold comes from collectibles, which you get from chests in the Collection tab.",
    position: "center"
  },
  quests: {
    title: "Quests",
    text: "Every day you get 5 quests, which are repeatable 5 times. Progress doesn't carry over between repeats, so claim them immediately. You get Quest Tokens from every completed quest and a small bit of gold that is mostly meant to help you get started on the Upgrades rather than provide you with a proper amount.",
    position: "center"
  },
  shop: {
    title: "Token Shop",
    text: "Buy consumables with Quest Tokens. The effects are immediately applied, so if for example you buy 6h event access, you get it immediately. The chests you purchase will be in the Collection tab, same as other chests. You can only have one temporary boost running at a time!",
    position: "center"
  },
  collection: {
    title: "Collection",
    text: "There are 5000 collectibles you can collect, each with their own rarity and a gold per second value based on that. You get 1 chest every 10 minutes to start with, with max 30 at a time, but you can increase this limit in the Upgrades. You can get Event Vouchers and Max Potions from chests at a 0.5% rate with a pity counter set to 200, so make sure to open these when you can.",
    position: "center"
  },
  trophyHall: {
    title: "Trophy Hall/Ascension", 
    text: "Fusing two Legendary T5 Dreamlings will always result in a star Legendary T5. Get it to level 1000 with a Max Potion and then you get the option of ascending it. Ascension removes the Dreamling from regular gameplay, but adds it to the Trophy Hall and its boosts become permanent, as though you have it in your party. Normally Legendaries have their boosts capped at level 250, but with ascension this becomes level 333. Not only will you free up a party slot by ascending a star Legendary T5 Dreamling, you will also get higher boosts from them, which definitely makes it worth it.",
    position: "center"
  },
  settings: {
    title: "Settings",
    text: "Trade, export, import, or make your storage BIG (5000) with the Gnome Home. Keep in mind that can't be reverted.",
    position: "center"
  },
  help: {
    title: "Help",
    text: "Clicked away too fast? Check this out.",
    position: "center"
  }
};

function showTutorialOverlay(tabId) {
  // Don't show if already seen
  if (tutorialFlags[tabId]) return;
  
  const content = tutorialContent[tabId];
  if (!content) return;
  
  // Add no-scroll class to body
  document.body.classList.add('no-scroll');
  
  // Create overlay
  const overlay = document.createElement("div");
  overlay.className = "tutorial-overlay";
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(3px);
    padding: 20px;
    box-sizing: border-box;
    overflow: hidden;
  `;
  
  // Create tutorial box
  const tutorialBox = document.createElement("div");
  tutorialBox.style.cssText = `
    background: linear-gradient(135deg, #4a4a4a, #2d2d2d);
    color: #f5f5dc;
    padding: 25px;
    border-radius: 15px;
    max-width: 600px;
    max-height: 80vh; /* Limit height to 80% of viewport */
    width: 100%; /* Take full available width up to max-width */
    text-align: center;
    border: 2px solid #8bc34a;
    box-shadow: 0 8px 25px rgba(0,0,0,0.5);
    overflow-y: auto; /* Enable vertical scrolling */
    overflow-x: hidden; /* Prevent horizontal scrolling */
    display: flex;
    flex-direction: column;
  `;
  
  // Title
  const title = document.createElement("h3");
  title.textContent = content.title;
  title.style.cssText = `
    margin: 0 0 15px 0;
    color: #8bc34a;
    font-size: 1.4em;
    flex-shrink: 0; /* Prevent title from shrinking */
  `;
  
  // Text container - this will scroll if content is too long
  const textContainer = document.createElement("div");
  textContainer.style.cssText = `
    margin: 0 0 20px 0;
    line-height: 1.5;
    font-size: 1.1em;
    text-align: left;
    flex: 1; /* Take available space */
    overflow-y: auto; /* Enable scrolling for text */
    min-height: 0; /* Important for flex scrolling */
  `;
  
  // Split text by line breaks and create paragraphs
  const paragraphs = content.text.split('\n\n');
  paragraphs.forEach(paragraph => {
    if (paragraph.trim()) {
      const p = document.createElement("p");
      p.textContent = paragraph;
      p.style.margin = "10px 0";
      p.style.textAlign = "left";
      textContainer.appendChild(p);
    }
  });
  
  // Function to close the overlay and restore scrolling
  const closeOverlay = () => {
    // Mark as seen
    tutorialFlags[tabId] = true;
    saveGame();
    
    // Remove overlay
    document.body.removeChild(overlay);
    
    // Remove no-scroll class to restore scrolling
    document.body.classList.remove('no-scroll');
  };
  
  // Got it button
  const button = document.createElement("button");
  button.textContent = "Got it!";
  button.className = "move-btn";
  button.style.cssText = `
    background: linear-gradient(to bottom, #8bc34a, #689f38);
    border: none;
    padding: 12px 25px;
    border-radius: 6px;
    color: white;
    cursor: pointer;
    font-size: 1em;
    transition: all 0.2s;
    flex-shrink: 0; /* Keep button fixed at bottom */
    margin-top: auto; /* Push button to bottom */
  `;
  
  button.addEventListener("mouseenter", () => {
    button.style.transform = "translateY(-2px)";
    button.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
  });
  
  button.addEventListener("mouseleave", () => {
    button.style.transform = "translateY(0)";
    button.style.boxShadow = "none";
  });
  
  button.addEventListener("click", closeOverlay);
  
  // Assemble and add to DOM
  tutorialBox.appendChild(title);
  tutorialBox.appendChild(textContainer);
  tutorialBox.appendChild(button);
  overlay.appendChild(tutorialBox);
  document.body.appendChild(overlay);
  
  // Close on overlay click (outside box)
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      closeOverlay();
    }
  });
}
//#endregion

//#region DREAMLINGS
// ---------- Rarity Data ----------
const rarities = {
  common:    { maxLevel: 25, baseBoost: 0.25, levelBoost: 0.01, tamingTime: 120, displayColor: "#808080" }, // grey
  uncommon:  { maxLevel: 50, baseBoost: 0.5,  levelBoost: 0.02, tamingTime: 240, displayColor: "#8de98dff" }, // green (make it stronger)
  rare:      { maxLevel: 100, baseBoost: 1,   levelBoost: 0.03, tamingTime: 480, displayColor: "#6495ED" }, // cornflower blue
  epic:      { maxLevel: 250, baseBoost: 2.5, levelBoost: 0.04, tamingTime: 960, displayColor: "#9e459eff" }, // purple
  legendary: { maxLevel: 500, baseBoost: 5,   levelBoost: 0.05, tamingTime: 1920, displayColor: "#B8860B" }  // gold
};

const BoostDisplayNames = {
  xp: "Experience",
  dreamPoints: "Dream Points",
  researchPoints: "Research Points",
  gold: "Gold Boost",
  taming: "Taming Speed",
  star: "Star Chance",
  critChance: "Crit Chance",
  energyRegen: "Energy Regen",
  maxEnergy: "Max Energy",
  chestRegen: "Chest Regen",
  maxChests: "Max Chests",
  maxParty: "Max Party Size",
  maxTraining: "Max Training Size",
  maxStorage: "Max Storage Size",
  maxQuests: "Max Quests"
};

// ---------- Bonus Types ----------
const bonusTypes = ["xp", "dreamPoints", "researchPoints", "taming", "star", "critChance", "gold"];

// ---------- Utility Functions ----------
function getRandomRarity() {
  const roll = Math.random() * 100;
  if (roll < 50) return "common";
  if (roll < 75) return "uncommon";
  if (roll < 90) return "rare";
  if (roll < 98) return "epic";
  return "legendary";
}

function getRandomRank() {
  const roll = Math.random() * 100;
  if (roll < 50) return "T1";
  if (roll < 75) return "T2";
  if (roll < 90) return "T3";
  if (roll < 97) return "T4";
  return "T5";
}

function getBonusCountForRank(rank) {
  const map = { T1: 1, T2: 2, T3: 3, T4: 4, T5: 5 };
  return map[rank] || 1;
}

function getRandomBonusTypes(count) {
  const available = [...bonusTypes];
  const result = [];
  for (let i = 0; i < count && available.length > 0; i++) {
    const index = Math.floor(Math.random() * available.length);
    result.push({ type: available.splice(index, 1)[0] });
  }
  return result;
}

function getSpeciesForArea(area) {
  // Make sure the area exists
  if (!speciesByArea || !speciesByArea[area]) {
    console.warn(`No species found for area: ${area}. Defaulting to event pool.`);
  }

  // If area is "event", pick from seasonal species instead
  if (area === "event") {
    const currentMonth = new Date().getMonth() + 1; // 1–12
    const currentYear = new Date().getFullYear();
    const key = `${currentMonth}-${currentYear}`;
    const eventList = seasonalSpecies[key] || seasonalSpecies["10-25"] || [];
    if (eventList.length > 0) {
      return eventList[Math.floor(Math.random() * eventList.length)];
    }
    console.warn(`No event species found for key: ${key}`);
    return "Unknown Eventling";
  }

  // Otherwise, pick from the normal area pool
  const pool = speciesByArea[area];
  if (!pool || pool.length === 0) return "Unknown Dreamling";
  return pool[Math.floor(Math.random() * pool.length)];
}

function calculateStarChance() {
  const base = 0.005; // 0.5%
  const boosts = calculateBoosts();

  // Apply boost multiplicatively
  let chance = base * (boosts.star || 1);

  // Cap total chance at 5%
  chance = Math.min(chance, 0.05);

  return chance;
}

function calculateCritChance() {
  const base = 0.01; // 1% base crit chance
  const boosts = calculateBoosts();
  
  const uncappedChance = base * (boosts.critChance || 1);
  
  // Cap at 10%
  return Math.min(uncappedChance, 0.10);
}

function generateUniqueId() {
  return nextDreamlingId++;
}

function generateTradeId() {
    return crypto.randomUUID();
}

function ensureUniqueDreamlingIDs() {
  const seen = new Set();
  const arrays = [partyDreamlings, trainingDreamlings, storageDreamlings, ranchDreamling];
  let highestId = nextDreamlingId;

  arrays.forEach(arr => {
    arr.forEach(d => {
      // If ID is missing or not a clean integer (timestamp-like), fix it
      if (!d.id || !Number.isInteger(d.id) || d.id > 999999) {
        d.id = generateUniqueId();
      }

      // Ensure no duplicates
      while (seen.has(d.id)) {
        d.id = generateUniqueId();
      }

      seen.add(d.id);
      highestId = Math.max(highestId, d.id);
    });
  });

  // Update next ID counter to be ahead of the highest used ID
  nextDreamlingId = highestId + 1;
}

// ---------- Dreamling Generator ----------
function generateDreamling(isWild=false, currentArea="forest") {
  const rarity = getRandomRarity();
  const rank = getRandomRank();
  const starChance = calculateStarChance();
  const isStar = Math.random() < starChance;
  const species = getSpeciesForArea(currentArea);

  const rarityData = rarities[rarity];
  const currentBoosts = calculateBoosts();

  // Apply to base taming requirement
  let tamingRequired;
  if (isStar) {
      tamingRequired = 1; // always 1 second for stars
  } else {
      const baseTamingRequired = rarityData.tamingTime;
      const fullMultiplier = currentBoosts?.taming ?? 1;
      const softenedMultiplier = 1 + (fullMultiplier - 1) * 0.25;
      tamingRequired = Math.max(baseTamingRequired / softenedMultiplier, 30);
  }

  const bonusCount = getBonusCountForRank(rank);
  const bonusBoosts = getRandomBonusTypes(bonusCount);

  // Check if species is part of current seasonal/event species
  let isEvent = false;
  let eventIdentity = null;

  const now = new Date();
  const monthKey = `${now.getMonth()+1}-${now.getFullYear().toString().slice(-2)}`; // e.g., "10-25"
  const seasonalList = seasonalSpecies[monthKey] || [];

  if (seasonalList.includes(species)) {
    isEvent = true;
    eventIdentity = monthKey; // store month/year
  }

  const dreamling = {
    id: generateUniqueId(),
    species,
    rarity,
    rank,
    isStar,
    level: 1,
    xp: 0,
    location: "party",
    baseBoost: rarityData.baseBoost,
    bonusBoosts,
    maxLevel: isStar ? rarityData.maxLevel*2 : rarityData.maxLevel,
    isWild,
    tamingElapsed: 0,
    tamingProgress: 0,
    tamingRequired,
    isEvent,
    eventIdentity,
    isTraded: false,
    pendingTrade: false,
    tradingExpiresAt: null,
    disappearEndTime: isWild ? new Date(Date.now() + (600 + Math.random()*300)*1000) : null,
    tamingCompleteTime: isWild ? new Date(Date.now() + tamingRequired*1000) : null
  };

  return dreamling;
}

function cleanupDreamlingBonuses() {
    const allDreamlings = [...partyDreamlings, ...trainingDreamlings, ...storageDreamlings, ...ascendedDreamlings, ...(ranchDreamling || [])];
    let replacedCount = 0;
    
    // Clean up dreamlings first
    allDreamlings.forEach(dreamling => {
        // Check bonusBoosts array
        if (dreamling.bonusBoosts && Array.isArray(dreamling.bonusBoosts)) {
            dreamling.bonusBoosts.forEach(boost => {
                if (boost.type === 'building') {
                    // Get all existing boost types for this dreamling
                    const existingTypes = new Set();
                    
                    // Add base boost type
                    if (dreamling.baseBoost && dreamling.baseBoost.type) {
                        existingTypes.add(dreamling.baseBoost.type);
                    }
                    
                    // Add all bonus boost types
                    dreamling.bonusBoosts.forEach(b => {
                        if (b.type && b.type !== 'building') {
                            existingTypes.add(b.type);
                        }
                    });
                    
                    // Get available replacements (bonusTypes that aren't already on this dreamling)
                    const availableReplacements = bonusTypes.filter(type => !existingTypes.has(type));
                    
                    if (availableReplacements.length > 0) {
                        // Pick a random available replacement
                        const randomReplacement = availableReplacements[Math.floor(Math.random() * availableReplacements.length)];
                        boost.type = randomReplacement;
                        replacedCount++;
                    } else {
                        // If all bonusTypes are already present, just use a random one (duplicate)
                        const randomReplacement = bonusTypes[Math.floor(Math.random() * bonusTypes.length)];
                        boost.type = randomReplacement;
                        replacedCount++;
                    }
                }
            });
        }
        
        // Also check baseBoost (though it probably won't be 'building')
        if (dreamling.baseBoost && dreamling.baseBoost.type === 'building') {
            // Get all existing bonus boost types
            const existingTypes = new Set();
            if (dreamling.bonusBoosts) {
                dreamling.bonusBoosts.forEach(b => {
                    if (b.type && b.type !== 'building') {
                        existingTypes.add(b.type);
                    }
                });
            }
            
            // Get available replacements
            const availableReplacements = bonusTypes.filter(type => !existingTypes.has(type));
            
            if (availableReplacements.length > 0) {
                const randomReplacement = availableReplacements[Math.floor(Math.random() * availableReplacements.length)];
                dreamling.baseBoost.type = randomReplacement;
                replacedCount++;
            } else {
                const randomReplacement = bonusTypes[Math.floor(Math.random() * bonusTypes.length)];
                dreamling.baseBoost.type = randomReplacement;
                replacedCount++;
            }
        }
    });
    
    // Clean up permanentBoosts object
    if (permanentBoosts && permanentBoosts.building) {
        delete permanentBoosts.building;
        replacedCount++;
    }
    
    if (replacedCount > 0) {
        showMessage(`🔄 Updated ${replacedCount} dreamlings with new boosts (removed old building boost)`);
    }
    
    return replacedCount;
}

// Fix array order by sorting by ID
function fixDreamlingOrder() {
    partyDreamlings.sort((a, b) => a.id - b.id);
    trainingDreamlings.sort((a, b) => a.id - b.id);
    storageDreamlings.sort((a, b) => a.id - b.id);
    ranchDreamling.sort((a, b) => a.id - b.id);
    
    console.log("Dreamling arrays reordered by ID");
}

// Move Dreamling
function moveDreamling(dreamlingId, fromSection, toSection) {
    const sectionMap = {
        party: partyDreamlings,
        training: trainingDreamlings,
        storage: storageDreamlings
    };

    const fromArray = sectionMap[fromSection];
    const toArray = sectionMap[toSection];
    if (!fromArray || !toArray) return;

    // Find by ID (works for both number and string)
    const index = fromArray.findIndex(d => d.id === dreamlingId);
    if (index === -1) {
        console.error("Dreamling not found:", dreamlingId);
        return;
    }

    if (fromSection === "party" && partyDreamlings.length === 1) {
        showMessage("You must always have at least 1 Dreamling in your party!");
        return;
    }

    const [dreamling] = fromArray.splice(index, 1);
    toArray.push(dreamling);

    renderAllSections();
}

function releaseDreamling(id, from) {
    showConfirm(
        "Are you sure you want to release this Dreamling?",
        () => {
            const getArray = (name) => {
            switch (name) {
            case "party": return partyDreamlings;
            case "training": return trainingDreamlings;
            case "storage": return storageDreamlings;
            case "ranch": return ranchDreamling;
            default: return [];
            }
        };

        const array = getArray(from);
        const index = array.findIndex(x => x.id === id);
        if (index === -1) return;

        const dreamling = array[index];

        // Determine released value
        const baseValues = {
            common: 0.1,
            uncommon: 0.2,
            rare: 0.3,
            epic: 0.4,
            legendary: 0.5
        };

        let releasedValue = baseValues[dreamling.rarity.toLowerCase()] || 0;
        if (dreamling.isStar) releasedValue *= 2;

        // Add to released counter
        releasedPoints += releasedValue;

        // Remove Dreamling from array
        array.splice(index, 1);

        renderAllSections();
        showMessage(`Released ${dreamling.species} (${dreamling.rarity}${dreamling.isStar ? "⭐" : ""}) for ${releasedValue} Research Points per second!`);
        }
    );
}

// Get base boost for a Dreamling (from rarity and level)
function getDreamlingBoost(dreamling) {
  const rarityData = rarities[dreamling.rarity];
  if (!rarityData) return 0;

  let level = dreamling.level;

  // Cap level for legendary rarity
  if (dreamling.rarity === "legendary" && level > 250) {
    level = 250;
  }

  return rarityData.baseBoost + (rarityData.levelBoost * level);
}

function getLevelXP(dreamling) {
  const level = dreamling.level || 1;
  const xp = dreamling.xp || 0;

  // Approximately 18,000 total XP to level 25
  const maxXP = Math.max(100, Math.floor(45 * Math.pow(level, 1.78)));

  return { currentXP: xp, maxXP };
}

function exportDreamlingsToCSV() {
  // Combine all arrays
  const allDreamlings = [
    ...partyDreamlings.map(d => ({...d, location: 'party'})),
    ...trainingDreamlings.map(d => ({...d, location: 'training'})),
    ...storageDreamlings.map(d => ({...d, location: 'storage'})),
    ...ranchDreamling.map(d => ({...d, location: 'ranch'}))
  ];
  
  if (allDreamlings.length === 0) {
    alert('No Dreamlings to export!');
    return;
  }
  
  // CSV Headers
  const headers = [
    'ID',
    'Species',
    'Rarity',
    'Rank',
    'Level',
    'Max Level',
    'XP',
    'Boost Value',
    'Bonus Boost 1',
    'Bonus Boost 2',
    'Bonus Boost 3',
    'Bonus Boost 4',
    'Bonus Boost 5',
    'Is Star',
    'Is Event',
    'Event Identity',
    'Is Traded',
    'Location'
  ];
  
  // Build CSV rows
  const rows = allDreamlings.map(d => {
    const boostValue = getDreamlingBoost(d);
    
    // Get up to 5 bonus boosts with display names
    const boost1 = d.bonusBoosts[0]?.type ? (BoostDisplayNames[d.bonusBoosts[0].type] || d.bonusBoosts[0].type) : '';
    const boost2 = d.bonusBoosts[1]?.type ? (BoostDisplayNames[d.bonusBoosts[1].type] || d.bonusBoosts[1].type) : '';
    const boost3 = d.bonusBoosts[2]?.type ? (BoostDisplayNames[d.bonusBoosts[2].type] || d.bonusBoosts[2].type) : '';
    const boost4 = d.bonusBoosts[3]?.type ? (BoostDisplayNames[d.bonusBoosts[3].type] || d.bonusBoosts[3].type) : '';
    const boost5 = d.bonusBoosts[4]?.type ? (BoostDisplayNames[d.bonusBoosts[4].type] || d.bonusBoosts[4].type) : '';
    
    return [
      d.id,
      d.species,
      capitalize(d.rarity),
      d.rank,
      d.level,
      d.maxLevel,
      d.xp.toFixed(2),
      boostValue.toFixed(2),
      boost1,
      boost2,
      boost3,
      boost4,
      boost5,
      d.isStar ? 'Yes' : 'No',
      d.isEvent ? 'Yes' : 'No',
      d.eventIdentity || '',
      d.isTraded ? 'Yes' : 'No',
      capitalize(d.location),
    ].map(cell => {
      // Escape commas and quotes
      const str = String(cell);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',');
  });
  
  // Combine headers and rows
  const csv = [headers.join(','), ...rows].join('\n');
  
  // Create download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `dreamlings_export_${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  alert(`Exported ${allDreamlings.length} Dreamlings to CSV!`);
}
//#endregion

//#region TRADING
// Simplified QR decoding using only jsQR
async function decodeDreamlingFromQR(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        img.onload = function() {
            try {
                console.log("Image loaded:", img.width, "x", img.height);
                
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0, img.width, img.height);
                
                if (typeof jsQR !== 'undefined') {
                    console.log("Scanning with jsQR...");
                    
                    // Define QR regions for BOTH card sizes
                    const qrRegions = [
                        // NEW CARD SIZE: 400x500 with 200px QR
                        { 
                            size: 200, 
                            x: Math.floor((img.width - 200) / 2), 
                            y: img.height - 200 - 30, // 30px padding from bottom
                            name: "New Large QR (400x500 card)" 
                        },
                        // OLD CARD SIZE: 300x400 with 150px QR  
                        { 
                            size: 150, 
                            x: Math.floor((img.width - 150) / 2), 
                            y: img.height - 150 - 20, // 20px padding from bottom
                            name: "Old Standard QR (300x400 card)" 
                        },
                        // Fallback: Try different positions
                        { 
                            size: 200, 
                            x: 100, 
                            y: 300, 
                            name: "Fallback Position 1" 
                        },
                        { 
                            size: 150, 
                            x: 125, 
                            y: 250, 
                            name: "Fallback Position 2" 
                        }
                    ];
                    
                    let foundCode = null;
                    
                    for (const region of qrRegions) {
                        // Only try if the region fits within the image
                        if (region.x >= 0 && region.y >= 0 && 
                            region.x + region.size <= img.width && 
                            region.y + region.size <= img.height) {
                            
                            console.log(`Checking ${region.name} at (${region.x}, ${region.y}) size ${region.size}px`);
                            
                            const regionData = ctx.getImageData(region.x, region.y, region.size, region.size);
                            const code = jsQR(regionData.data, region.size, region.size, {
                                inversionAttempts: "attemptBoth",
                            });
                            
                            if (code) {
                                console.log(`✅ QR found in ${region.name}:`, code.data);
                                foundCode = code;
                                break;
                            } else {
                                console.log(`  ❌ No QR found in ${region.name}`);
                            }
                        } else {
                            console.log(`  ⚠️ Skipping ${region.name} - region outside image bounds`);
                        }
                    }
                    
                    if (foundCode) {
                        resolve(foundCode.data);
                    } else {
                        console.log("❌ No QR code found in any expected region");
                        
                        // Final attempt: Scan entire bottom half of image
                        console.log("Final attempt: Scanning entire bottom section...");
                        const bottomSectionHeight = Math.floor(img.height / 2);
                        const bottomSectionData = ctx.getImageData(0, img.height - bottomSectionHeight, img.width, bottomSectionHeight);
                        const bottomCode = jsQR(bottomSectionData.data, img.width, bottomSectionHeight, {
                            inversionAttempts: "attemptBoth",
                        });
                        
                        if (bottomCode) {
                            console.log("✅ QR found in bottom section scan:", bottomCode.data);
                            resolve(bottomCode.data);
                        } else {
                            reject(new Error(
                                "This card doesn't have a readable QR code.\n\n" +
                                "Possible reasons:\n" +
                                "• The card was generated with a broken QR code\n" + 
                                "• The image is too low quality\n" +
                                "• The QR code is in an unexpected location\n\n" +
                                "Card size: " + img.width + "x" + img.height + "\n" +
                                "Ask the creator to regenerate the card."
                            ));
                        }
                    }
                } else {
                    reject(new Error("QR scanning library not available"));
                }
                
            } catch (error) {
                console.error("QR processing error:", error);
                reject(new Error("Failed to process image: " + error.message));
            } finally {
                URL.revokeObjectURL(img.src);
            }
        };
        
        img.onerror = () => {
            console.error("Failed to load image");
            URL.revokeObjectURL(img.src);
            reject(new Error("Failed to load image file"));
        };
        
        img.crossOrigin = "anonymous";
        img.src = URL.createObjectURL(file);
    });
}

async function createDreamlingTradeCard(dreamling) {
  console.log("=== DREAMLING TRADE CARD GENERATION ===");
  console.log("Dreamling:", dreamling.species, dreamling.rarity, dreamling.rank);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Keep the larger card size for better QR code
  const cardWidth = 400;
  const cardHeight = 500;
  canvas.width = cardWidth;
  canvas.height = cardHeight;

  const rarityColor = rarities[dreamling.rarity]?.displayColor || '#808080';
  console.log("Step 1: Card setup complete", { cardWidth, cardHeight, rarityColor });

  // Background
  ctx.fillStyle = '#636363';
  ctx.fillRect(0, 0, cardWidth, cardHeight);

  // Border
  ctx.strokeStyle = rarityColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, cardWidth - 4, cardHeight - 4);

  // Header bar
  ctx.fillStyle = rarityColor;
  ctx.fillRect(10, 10, cardWidth - 20, 40);

  // Header text
  ctx.fillStyle = '#111';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${dreamling.isStar ? '⭐ ' : ''}${capitalize(dreamling.rarity)} ${dreamling.rank}`,
    cardWidth / 2,
    35
  );

  // Species
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 24px Arial';
  ctx.fillText(dreamling.species, cardWidth / 2, 80);

  // Level display (REMOVED XP BAR - using text only)
  const { currentXP, maxXP } = getLevelXP(dreamling);
  ctx.fillStyle = '#fff';
  ctx.font = '16px Arial';
  ctx.fillText(
    `Level ${dreamling.level} (${Math.floor(currentXP).toLocaleString()}/${Math.floor(maxXP).toLocaleString()} XP)`,
    cardWidth / 2,
    110
  );

  // Boosts - NOW CAN DISPLAY ALL 5 WITHOUT XP BAR
  let yPos = 140; // Moved up since we removed XP bar
  ctx.textAlign = 'left';
  ctx.font = '14px Arial';

  const uniqueBoosts = [...new Map(dreamling.bonusBoosts.map(b => [b.type, b])).values()];
  
  // Display ALL boosts (up to 5) since we removed XP bar
  uniqueBoosts.forEach(boost => {
    const displayName = BoostDisplayNames?.[boost.type] || boost.type;
    const baseValue = getDreamlingBoost(dreamling);
    ctx.fillStyle = '#fff';
    ctx.fillText(`${displayName}: +${baseValue.toFixed(2)}%`, 20, yPos);
    yPos += 22;
  });

  // Event badge
  if (dreamling.isEvent) {
    ctx.save();
    ctx.translate(cardWidth - 40, 40);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.fillRect(-75, -15, 150, 30);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(dreamling.eventIdentity || 'EVENT', 0, 5);
    ctx.restore();
  }

  // Star overlay
  if (dreamling.isStar) {
    ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
    ctx.fillRect(0, 0, cardWidth, 60);
  }

  console.log("Step 2: Card content drawn");

  // TRADE CODE as QR Code
  const tradeData = {
    s: dreamling.species,
    r: dreamling.rarity,
    k: dreamling.rank,
    star: dreamling.isStar || false,
    l: dreamling.level,
    xp: dreamling.xp,
    b: dreamling.bonusBoosts || [],
    evt: dreamling.isEvent || false,
    eid: dreamling.eventIdentity || null,
    ml: dreamling.maxLevel
  };

  const tradeCode = JSON.stringify(tradeData);
  console.log("Step 3: Trade data prepared", { 
    dataLength: tradeCode.length,
    tradeCode: tradeCode 
  });

  // QR Code generation with COMPREHENSIVE validation
  try {
    console.log("Step 4: Starting QR code generation...");
    
    if (typeof QRCode === 'undefined') {
      throw new Error('QRCode library not loaded - check script includes');
    }
    
    if (!QRCode.toCanvas) {
      throw new Error('QRCode.toCanvas method not available');
    }

    const qrCanvas = document.createElement('canvas');
    const qrSize = 200;
    qrCanvas.width = qrSize;
    qrCanvas.height = qrSize;
    
    console.log(`Step 4a: Generating ${qrSize}x${qrSize} QR code...`);
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('QR code generation timed out after 10 seconds'));
      }, 10000);
      
      QRCode.toCanvas(qrCanvas, tradeCode, { 
        width: qrSize, 
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        clearTimeout(timeout);
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
    
    console.log("Step 4b: QR code generated, starting validation...");

    // VALIDATION 1: Check if QR has black pixels
    const qrCtx = qrCanvas.getContext('2d');
    const qrImageData = qrCtx.getImageData(0, 0, qrSize, qrSize);
    let blackPixels = 0;
    let whitePixels = 0;
    
    for (let i = 0; i < qrImageData.data.length; i += 4) {
      if (qrImageData.data[i] < 128) blackPixels++;
      else whitePixels++;
    }
    
    console.log(`Step 4c: QR pixel analysis - ${blackPixels} black, ${whitePixels} white pixels`);
    
    if (blackPixels === 0) {
      throw new Error('QR code generated but contains no black pixels (completely white)');
    }
    
    if (blackPixels > qrSize * qrSize * 0.9) {
      throw new Error('QR code appears solid black (too many dark pixels)');
    }

    // VALIDATION 2: Test if QR is actually readable
    if (typeof jsQR !== 'undefined') {
      console.log("Step 4d: Testing QR code readability...");
      const testCode = jsQR(qrImageData.data, qrSize, qrSize, {
        inversionAttempts: "attemptBoth",
      });
      
      if (testCode) {
        console.log("Step 4e: ✅ QR code self-test PASSED:", testCode.data);
        
        // Verify the data matches what we encoded
        if (testCode.data !== tradeCode) {
          console.warn("QR code data mismatch - generated vs read:", tradeCode, testCode.data);
        }
      } else {
        throw new Error('QR code generated but cannot be read back - likely corrupted');
      }
    } else {
      console.warn("Step 4d: jsQR not available, skipping readability test");
    }

    console.log("Step 5: Drawing QR code onto card...");
    
    // Draw larger QR code centered at bottom with proper spacing
    const bottomPadding = 30;
    const qrX = (cardWidth - qrSize) / 2;
    const qrY = cardHeight - qrSize - bottomPadding;
    
    console.log(`Step 5a: QR position - x: ${qrX}, y: ${qrY}, size: ${qrSize}`);
    
    // Draw white background behind QR for better contrast
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10);
    
    // Draw the QR code
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
    
    console.log("Step 5b: QR code drawn onto card");

    // VALIDATION 3: Verify QR is still readable after placement
    if (typeof jsQR !== 'undefined') {
      console.log("Step 6: Final validation - testing QR on final card...");
      const finalQRRegion = ctx.getImageData(qrX, qrY, qrSize, qrSize);
      const finalCode = jsQR(finalQRRegion.data, qrSize, qrSize, {
        inversionAttempts: "attemptBoth",
      });
      
      if (finalCode) {
        console.log("Step 6a: ✅ Final QR validation PASSED");
      } else {
        console.error("Step 6a: ❌ Final QR validation FAILED - QR corrupted during card rendering");
        console.warn("QR code readable during generation but not after card placement");
      }
    }
    
    console.log("=== CARD GENERATION COMPLETE ===");
    
  } catch (qrError) {
    console.error('❌ QR generation FAILED:', qrError);
    
    const errorDetails = {
      step: 'QR Generation',
      error: qrError.message,
      tradeDataLength: tradeCode.length,
      libraryAvailable: typeof QRCode !== 'undefined',
      libraryMethod: typeof QRCode?.toCanvas
    };
    
    console.error('Error details:', errorDetails);
    
    // Create a visual error indicator on the card
    ctx.fillStyle = '#FF0000';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QR GENERATION FAILED', cardWidth / 2, cardHeight - 100);
    ctx.fillText('Card cannot be imported', cardWidth / 2, cardHeight - 80);
    ctx.fillStyle = '#FF6B6B';
    ctx.fillRect(50, cardHeight - 150, cardWidth - 100, 100);
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.fillText('Please try regenerating this card', cardWidth / 2, cardHeight - 60);
    
    throw new Error(`Failed to generate QR code: ${qrError.message}. This card cannot be used for trading.`);
  }

  console.log("✅ Dreamling trade card generated successfully");
  return canvas;
}

// Call this once to render all pending trades initially
async function showPendingTradeCard(dreamling) {
  const canvas = await createDreamlingTradeCard(dreamling);
  const dataUrl = canvas.toDataURL('image/png');
  
  const overlay = document.createElement('div');
  Object.assign(overlay.style, {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0,0,0,0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    padding: '20px',
    zIndex: 9999
  });
  
  const img = document.createElement('img');
  img.src = dataUrl;
  img.style.cssText = 'border:2px solid #fff;border-radius:10px;max-width:90%;max-height:70vh;';
  overlay.appendChild(img);
  
  const btnContainer = document.createElement('div');
  btnContainer.style.cssText = 'margin-top:15px;display:flex;gap:10px';
  
  const downloadBtn = document.createElement('button');
  downloadBtn.textContent = 'Download Card';
  downloadBtn.onclick = () => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${dreamling.species}_${capitalize(dreamling.rarity)}_${dreamling.rank}_Lvl${dreamling.level}.png`;
    a.click();
  };
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.onclick = () => document.body.removeChild(overlay);
  
  [downloadBtn, closeBtn].forEach(btn => {
    Object.assign(btn.style, {
      background: '#444',
      color: '#fff',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px'
    });
  });
  
  btnContainer.appendChild(downloadBtn);
  btnContainer.appendChild(closeBtn);
  overlay.appendChild(btnContainer);
  document.body.appendChild(overlay);
}

// Updated renderPendingTradesSafe function
function renderPendingTradesSafe() {
  const container = document.getElementById("pending-trades");
  if (!container) return;

  container.innerHTML = "";

  const now = Date.now();

  pendingTrades.forEach(trade => {
    const d = trade.dreamling;
    const tradeDiv = document.createElement("div");
    tradeDiv.className = "pending-trade-card";
    tradeDiv.style.cssText = `
      background:#444;
      color:#fff;
      padding:8px;
      border-radius:6px;
      margin:6px 0;
      display:flex;
      justify-content:space-between;
      align-items:center;
    `;

    const infoDiv = document.createElement("div");
    infoDiv.textContent = `${d.species} (${capitalize(d.rarity)} ${d.rank})`;

    const timerDiv = document.createElement("div");
    const remainingSec = Math.floor((trade.expiresAt - now) / 1000);
    timerDiv.textContent = remainingSec > 0 ? formatTimeHours(remainingSec) : "Expired";

    // Show Card Button (updated)
    const cardBtn = document.createElement("button");
    cardBtn.textContent = "Show Card";
    cardBtn.style.cssText = `
      margin-left:8px;
      padding:2px 6px;
      border-radius:4px;
      cursor:pointer;
      background:#3399FF;
      color:#fff;
      border:none;
      font-size:0.85em;
    `;
    cardBtn.onclick = () => {
      showPendingTradeCard(d);
    };

    // Wrap timer and button together
    const rightDiv = document.createElement("div");
    rightDiv.style.display = "flex";
    rightDiv.style.alignItems = "center";
    rightDiv.appendChild(timerDiv);
    rightDiv.appendChild(cardBtn);

    tradeDiv.appendChild(infoDiv);
    tradeDiv.appendChild(rightDiv);
    container.appendChild(tradeDiv);

    // Clear existing timer if present
    if (pendingTradeTimers.has(trade.id)) {
      clearInterval(pendingTradeTimers.get(trade.id));
      pendingTradeTimers.delete(trade.id);
    }

    if (remainingSec > 0) {
      const interval = setInterval(() => {
        const newRemainingSec = Math.floor((trade.expiresAt - Date.now()) / 1000);
        if (newRemainingSec > 0) {
          timerDiv.textContent = formatTimeHours(newRemainingSec);
        } else {
          timerDiv.textContent = "Expired";
          clearInterval(interval);
          pendingTradeTimers.delete(trade.id);
          const idx = pendingTrades.findIndex(t => t.id === trade.id);
          if (idx !== -1) pendingTrades.splice(idx, 1);
          renderPendingTradesSafe();
        }
      }, 1000);
      pendingTradeTimers.set(trade.id, interval);
    }
  });
}

// Replace your exportDreamlingSafe function with this
async function exportDreamlingSafe(dreamlingId) {
  const index = storageDreamlings.findIndex(dl => dl.id === dreamlingId);
  if (index === -1) return;
  const d = storageDreamlings[index];
  
  showConfirm(
    `Export ${d.species}? Will be unavailable for 24h and then removed.`,
    async () => {
      try {
        console.log(`Exporting ${d.species}...`);
        
        // Remove from storage
        storageDreamlings.splice(index, 1);
        d.pendingTrade = true;
        d.tradeExpiresAt = Date.now() + 24*60*60*1000;
        
        pendingTrades.push({ 
          id: d.id, 
          dreamling: d, 
          expiresAt: d.tradeExpiresAt 
        });
        
        // Create card with embedded data - THIS MAY NOW THROW ERRORS
        console.log("Generating trade card...");
        const canvas = await createDreamlingTradeCard(d);
        console.log("Trade card generated successfully");
        
        const dataUrl = canvas.toDataURL('image/png');
        
        // Show overlay with download option
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          padding: '20px',
          zIndex: 9999
        });
        
        const img = document.createElement('img');
        img.src = dataUrl;
        img.style.cssText = 'border:2px solid #fff;border-radius:10px;max-width:90%;max-height:70vh;';
        overlay.appendChild(img);
        
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'margin-top:15px;display:flex;gap:10px';
        
        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download Card';
        downloadBtn.onclick = () => {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `${d.species}_${capitalize(d.rarity)}_${d.rank}_Lvl${d.level}.png`;
          a.click();
        };
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.onclick = () => document.body.removeChild(overlay);
        
        [downloadBtn, closeBtn].forEach(btn => {
          Object.assign(btn.style, {
            background: '#444',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          });
        });
        
        btnContainer.appendChild(downloadBtn);
        btnContainer.appendChild(closeBtn);
        overlay.appendChild(btnContainer);
        document.body.appendChild(overlay);
        
        renderAllSections();
        
      } catch (error) {
        console.error("Failed to create trade card:", error);
        
        // REVERT THE EXPORT SINCE IT FAILED
        storageDreamlings.splice(index, 0, d); // Put back in storage
        d.pendingTrade = false;
        d.tradeExpiresAt = null;
        const tradeIndex = pendingTrades.findIndex(t => t.id === d.id);
        if (tradeIndex !== -1) pendingTrades.splice(tradeIndex, 1);
        
        // Show error to user
        alert(`Failed to export ${d.species}: ${error.message}\n\nThis Dreamling has been kept in your storage. Please try again.`);
        
        // Re-render to show the Dreamling is still in storage
        renderAllSections();
      }
    }
  );
}

// Hash function to create a unique fingerprint of the QR code data
function hashQRCode(qrData) {
  let hash = 0;
  const str = JSON.stringify(qrData);
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
}

// Clean up expired redeemed codes (24 hours old)
function cleanupExpiredQRCodes() {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  const beforeCount = redeemedQRCodes.length;
  redeemedQRCodes = redeemedQRCodes.filter(entry => {
    return (now - entry.timestamp) < maxAge;
  });
  
  const removedCount = beforeCount - redeemedQRCodes.length;
  if (removedCount > 0) {
    console.log(`Cleaned up ${removedCount} expired QR codes`);
  }
}

// Check if a QR code has been redeemed (and not expired)
function isQRCodeRedeemed(dreamData) {
  cleanupExpiredQRCodes(); // Clean up first
  const codeHash = hashQRCode(dreamData);
  return redeemedQRCodes.some(entry => entry.hash === codeHash);
}

// Mark a QR code as redeemed
function markQRCodeRedeemed(dreamData) {
  const codeHash = hashQRCode(dreamData);
  redeemedQRCodes.push({
    hash: codeHash,
    timestamp: Date.now()
  });
  console.log(`Marked QR code as redeemed: ${codeHash}`);
}

// Replace your import handler
document.getElementById("import-qr-btn").onclick = () => {
  document.getElementById("import-qr-input").click();
};

// Update button text in HTML
document.getElementById("import-qr-btn").textContent = "Import Dreamling Card";

// Utility to load an image from a file
function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

// Enhanced import handler with better error messages
// Enhanced import handler with redemption tracking
document.getElementById("import-qr-input").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file (PNG, JPG, etc.)');
        e.target.value = '';
        return;
    }

    // Show loading state
    const importBtn = document.getElementById("import-qr-btn");
    const originalText = importBtn.textContent;
    importBtn.textContent = "Decoding QR...";
    importBtn.disabled = true;

    try {
        console.log("Starting QR import process for file:", file.name, file.type, file.size);
        
        // 🔍 Decode QR from the image
        const qrText = await decodeDreamlingFromQR(file);
        console.log("Raw QR text received:", qrText);

        if (!qrText) {
            throw new Error("QR code was found but contained no data");
        }

        // Parse the QR data with multiple format attempts
        let dreamData;
        let parseMethod = "unknown";
        
        try {
            // Method 1: Direct JSON
            dreamData = JSON.parse(qrText);
            parseMethod = "direct JSON";
        } catch (jsonError) {
            try {
                // Method 2: Base64 encoded JSON
                const cleanText = qrText.replace(/^data:[^,]+,/, '').trim();
                const decodedString = atob(cleanText);
                dreamData = JSON.parse(decodedString);
                parseMethod = "Base64 JSON";
            } catch (base64Error) {
                try {
                    // Method 3: URI encoded JSON
                    const decodedURI = decodeURIComponent(qrText);
                    dreamData = JSON.parse(decodedURI);
                    parseMethod = "URI JSON";
                } catch (uriError) {
                    // Method 4: Try to extract JSON from any text
                    const jsonMatch = qrText.match(/\{.*\}/);
                    if (jsonMatch) {
                        dreamData = JSON.parse(jsonMatch[0]);
                        parseMethod = "extracted JSON";
                    } else {
                        throw new Error("Could not parse QR code data as JSON");
                    }
                }
            }
        }

        console.log(`Parsed dream data via ${parseMethod}:`, dreamData);

        // ✅ CHECK IF ALREADY REDEEMED
        if (isQRCodeRedeemed(dreamData)) {
            throw new Error("This trade card has already been imported! Each card can only be used once.");
        }

        // Validate required fields
        if (!dreamData.s || !dreamData.r) {
            throw new Error("Invalid QR code: missing species or rarity fields");
        }

        // Lookup rarity info
        const rarityData = rarities[dreamData.r];
        if (!rarityData) {
            throw new Error(`Unknown rarity: ${dreamData.r}. Valid rarities: ${Object.keys(rarities).join(', ')}`);
        }

        // Rebuild Dreamling object
        const dreamling = {
            id: generateUniqueId(),
            species: dreamData.s,
            rarity: dreamData.r,
            rank: dreamData.k || 1,
            isStar: dreamData.star || false,
            level: dreamData.l || 1,
            xp: dreamData.xp || 0,
            location: 'storage',
            baseBoost: rarityData.baseBoost,
            bonusBoosts: dreamData.b || [],
            maxLevel: dreamData.ml || (dreamData.star ? rarityData.maxLevel * 2 : rarityData.maxLevel),
            isWild: false,
            isEvent: dreamData.evt || false,
            eventIdentity: dreamData.eid || null,
            isTraded: true,
            pendingTrade: false,
            tradingExpiresAt: null,
        };

        // ✅ MARK AS REDEEMED BEFORE ADDING
        markQRCodeRedeemed(dreamData);

        // Add Dreamling to storage
        storageDreamlings.push(dreamling);
        logDreamlingToBook(dreamling);

        alert(`✅ ${dreamling.species} imported successfully!\nRarity: ${capitalize(dreamling.rarity)} ${dreamling.rank}\nLevel: ${dreamling.level}`);
        renderAllSections();
        saveGame(); // Save to persist the redeemed code list

    } catch (err) {
        console.error("Failed to import Dreamling QR:", err);
        
        let userMessage = `Failed to import Dreamling QR: ${err.message}`;
        
        if (err.message.includes("already been imported")) {
            // Clear message for duplicate imports
            userMessage = err.message;
        } else if (err.message.includes("No QR code") || err.message.includes("QR code was found")) {
            userMessage += "\n\nPlease ensure you're scanning a valid Dreamling card QR code.";
        } else if (err.message.includes("parse") || err.message.includes("JSON")) {
            userMessage += "\n\nThis doesn't appear to be a valid Dreamling card.";
        } else if (err.message.includes("load image")) {
            userMessage += "\n\nCould not read the image file.";
        }
        
        alert(userMessage);
    } finally {
        // Reset UI state
        importBtn.textContent = originalText;
        importBtn.disabled = false;
        
        // Reset input
        e.target.value = '';
    }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log("QR Scanner initialized");
    // Test that QrScanner is available
    if (typeof QrScanner === 'undefined') {
        console.error("QR Scanner library not loaded!");
    } else {
        console.log("QR Scanner library loaded successfully");
    }
});
//#endregion

//#region SPECIES BY AREA
const areas = [
    "forest", "mountain", "lake", "marsh", "swamp",
    "desert", "volcano", "city", "ocean", "tundra",
    "caverns", "meadow", "skylands", "event"
  ];

// ---------- Species Distributor ----------
function createSpeciesDistribution(speciesPool, seasonalSpecies) {
  // Initialize empty lists for each area
  const distribution = {};
  areas.forEach(area => distribution[area] = []);

  // Fill the "event" area with the current seasonal species
  const now = new Date();
  const key = `${now.getMonth() + 1}-${now.getFullYear() % 100}`; // e.g., "10-25"
  distribution["event"] = seasonalSpecies[key] ? [...seasonalSpecies[key]] : [];

  // Filter out "event" from the normal areas
  const normalAreas = areas.filter(area => area !== "event");

  // Shuffle speciesPool
  const shuffledSpecies = [...speciesPool];
  for (let i = shuffledSpecies.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledSpecies[i], shuffledSpecies[j]] = [shuffledSpecies[j], shuffledSpecies[i]];
  }

  // Distribute species evenly across normal areas only
  shuffledSpecies.forEach((species, index) => {
    const area = normalAreas[index % normalAreas.length];
    distribution[area].push(species);
  });

  return distribution;
}

const speciesPool = ["Sparkus", "Twinklis", "Glimmer", "Shimmer", "Fluffis", "Puffles", "Bubbles", "Ripple", "Drifty", "Breezis", "Whispy", "Misty", "Foggle", 
        "Cloudis", "Rainlet", "Dewdrop", "Frostis", "Snowbell", "Iciclis", "Crystis", "Pebblis", "Boulder", "Muddle", "Clayis", "Sandle", "Dustis", "Ashlet", 
        "Embris", "Flamie", "Blazey", "Sparkle", "Zappy", "Boltis", "Flashis", "Glowbug", "Luminis", "Radiant", "Beamis", "Prismis", "Torrenta", "Cascadis", 
        "Streamlet", "Brooklet", "Pondle", "Lakelet", "Oceana", "Wavelet", "Tidalis", "Current", "Splashis", "Petalis", "Bloomis", "Budlet", "Floret", "Leafis", 
        "Vinelis", "Sproutis", "Seedling", "Mosslet", "Fernlet", "Clover", "Daisie", "Roselet", "Lilac", "Violetis", "Ivylet", "Hollyis", "Berrie", "Cherris", 
        "Plumlet", "Peachy", "Melonis", "Citrus", "Lemonis", "Mintis", "Basilis", "Sagelis", "Thymelis", "Lavendis", "Chamomis", "Honeydew", "Nectaris", 
        "Pollenis", "Buttercup", "Sunnybud", "Moonbloom", "Starflower", "Twilightis", "Dawnpetal", "Evenglow", "Orchidis", "Magnolia", "Azaleis", "Camillis", 
        "Gardenius", "Jasmine", "Hibisclet", "Marigold", "Pansylet", "Zinnia", "Stardust", "Nebula", "Cosmis", "Galaxia", "Lunaris", "Solaris", "Eclipsis", 
        "Cometis", "Meteora", "Astralis", "Celestis", "Orbitalis", "Zenithis", "Auroralis", "Prismatic", "Enchantis", "Mystique", "Runelis", "Spellbound", 
        "Charmed", "Jinxis", "Hexlet", "Wizbit", "Sorcelet", "Magicalis", "Wonderis", "Dreamlet", "Wishlet", "Hopeful", "Joylet", "Merriment", "Gigglys", 
        "Cheeris", "Gleeful", "Blissful", "Happiest", "Delightis", "Pleasantis", "Sweetlet", "Kindlet", "Miracle", "Serendip", "Fortunis", "Destiny", "Fatelis", 
        "Prophecy", "Omenis", "Mysticis", "Arcanus", "Ethereal", "Fluttersy", "Buzzlet", "Chirpis", "Tweetle", "Hootlet", "Peepis", "Squeak", "Squeakle", 
        "Pipsqueak", "Niblet", "Munchis", "Crunchlet", "Snaplet", "Chomper", "Bitelet", "Scurry", "Scamper", "Hoplet", "Bouncy", "Skiplet", "Jumpis", 
        "Leapis", "Tumble", "Rollis", "Spinis", "Curlis", "Swirlis", "Twirlis", "Whirlet", "Dizzy", "Wobbly", "Jiggly", "Wiggly", "Squiggle", "Zigzag", 
        "Zoomlet", "Dashis", "Swiftlet", "Quickis", "Speedlet", "Prowlus", "Stalkis", "Huntlet", "Trackis", "Snifflet", "Snoutis", "Pawlet", "Clawis", "Tailwhisk", 
        "Whisklet", "Jewelis", "Gemstone", "Diamondis", "Rublet", "Sapphire", "Emeris", "Topazis", "Amethis", "Opalescent", "Pearlescent", "Quartzis", "Jasperis", 
        "Agatis", "Jadelet", "Amberet", "Corallis", "Crystaline", "Shimmergem", "Glintstone", "Sparklite", "Treasure", "Goldlet", "Silveris", "Bronzelet", "Copperis", 
        "Ironlet", "Tinsel", "Glitter", "Shimmerite", "Lustrous", "Polishis", "Shinelet", "Glossis", "Gleamlet", "Twinklite", "Radiante", "Brillis", "Dazzlet", 
        "Glitzis", "Glamouris", "Luxuris", "Richlet", "Wealthis", "Opulent", "Splendor", "Finery", "Elegance", "Royalis", "Majestis", "Noblesse", "Caramelle", 
        "Toffeelis", "Fudgelet", "Sugaris", "Honeybun", "Syruplet", "Macaroon", "Cupcakis", "Mufflet", "Cookiet", "Brownie", "Trufflet", "Bonbonis", "Candyfloss", 
        "Lollipop", "Gumdrop", "Jellybean", "Marshlet", "Nougatis", "Choclet", "Vanillis", "Cinnamis", "Nutmeglet", "Gingerbread", "Peppermint", "Butterscotch", 
        "Maplesweet", "Mollasis", "Confetti", "Sprinklis", "Frosting", "Glazelet", "Creamis", "Whipplet", "Soufflet", "Puddingis", "Custardlet", "Tartlet", 
        "Pielis", "Pastrylet", "Crumblet", "Crisplet", "Chewlet", "Softlet", "Fluffcake", "Meltlet", "Sweetpea", "Honeywhisk", "Sugarplum",
        "Stormlet", "Thunderis", "Lightninglet", "Drizzlet", "Showeris", "Pouris", "Hailstone", "Sleetlet", "Blizzaris", "Flurrlet", "Chillwind", "Breezelis", 
        "Gustlet", "Galewing", "Cyclonis", "Whirlwind", "Tornadis", "Tempestlet", "Sunbeamlet", "Sunshower", "Rainbowlet", "Heatwave", "Summerglow", "Autumnis", 
        "Winterfrost", "Springbloom", "Harvestis", "Equinoxis", "Solsticelet", "Dawnis", "Dusklet", "Noonlet", "Midnightis", "Sunriselet", "Sunsetis", "Twilightglow", 
        "Morningdew", "Evenstar", "Daybreak", "Nightfall", "Starshine", "Moonbeam", "Sunspot", "Cloudbreak", "Clearskies", "Fairweather", "Balmy", "Mildlet", 
        "Cozywarm", "Fairylis", "Pixielet", "Spritelis", "Elfin", "Gnomelet", "Dwarflet", "Goblet", "Implet", "Dragonfly", "Wyrmlet", "Phoenixis", 
        "Grifflet", "Unicornis", "Pegaslet", "Centauris", "Minotlet", "Sphinxis", "Chimera", "Hydralit", "Basilet", "Krakenlet", "Leviath", "Behemoth", "Cerberus", 
        "Orthrus", "Mantis", "Harpylet", "Sirenlet", "Nymphlet", "Dryad", "Naiadis", "Nereida", "Oceanid", "Sylphis", "Banshee", "Wraith", "Spectlet", "Phantomis", 
        "Ghoullet", "Zomblet", "Lichlet", "Mummlet", "Vamplet", "Lycanis", "Wolflet", "Werelet", "Shapeshifter", "Mimiclet", "Dopplet", "Shadowkin", "Coralette", 
        "Reeflet", "Shellby", "Conchis", "Nautilus", "Kelplet", "Seaweedis", "Algaelet", "Plankton", "Krillis", "Shrimplet", "Crablet", "Lobsterette", "Clammis", 
        "Oysterlet", "Scallopis", "Mussel", "Barnaclet", "Anemone", "Jellyfin", "Squidlet", "Octoplet", "Cuttlefish", "Manta", "Raylet", "Sharklet", "Dolphinis", 
        "Whalelet", "Sealion", "Otterly", "Pengulet", "Puffinis", "Albatross", "Gullwing", "Pelican", "Seahorse", "Starfishlet", "Urchinis", "Spongelis", 
        "Tidepoolet", "Lagoonlet", "Baylet", "Covelis", "Inletis", "Estuaris", "Mangrove", "Saltwateris", "Deepdive", "Abysslet", "Trenchlet", "Oaklet", "Pinecone", 
        "Birchlet", "Mapleleaf", "Willowis", "Cedarling", "Redwoodlet", "Elmlet", "Ashwood", "Beechlet", "Hickoris", "Walnutis", "Chestnutlet", "Hazelnut", 
        "Acornlet", "Twiglet", "Branchlet", "Barklet", "Rootlet", "Saplet", "Timberling", "Loglet", "Stumplet", "Grovekin", "Thicketis", "Canopylet", "Understory", 
        "Clearinglet", "Pathfinder", "Trailet", "Deerlass", "Fawnlet", "Bucklet", "Doelet", "Rabbitlet", "Bunnykin", "Squirrelis", "Chipmunk", "Raccoonlet", 
        "Badgerlet", "Foxlet", "Wolfpup", "Bearlet", "Owlette", "Woodpecker", "Robinlet", "Sparrowis", "Finchlet", "Bluejay", "Cardinal", "Sandstorm", "Dunelet", 
        "Oasisis", "Cactuslet", "Succulis", "Yuccalet", "Sagebrush", "Tumbleweed", "Lizardlet", "Geckolet", "Chameleon", "Skinklet", "Sandviper", "Scorpis", 
        "Tarantlet", "Camelet", "Roadrunner", "Vulturelet", "Hawklet", "Eaglet", "Falconis", "Clifftop", "Craglet", "Boulderpeak", "Summitlet", "Alpinelet", 
        "Peaklet", "Valleykin", "Canyonlet", "Mesalet", "Plateaulet", "Foothillet", "Slopelet", "Ridgelet", "Glacierpeak", "Snowcap", "Icefall", "Avalanche", 
        "Rockslide", "Goatlet", "Llamalet", "Alpacalet", "Yaket", "Marmot", "Pooka", "Condorlet", "Ravenlet", "Crowlet", "Magpie", "Jaylet", "Gearis", "Coglet", 
        "Sprocket", "Boltlet", "Nutlet", "Screwlet", "Rivetis", "Circuitlet", "Wirelis", "Cablelet", "Pluglet", "Socketis", "Switchlet", "Buttonlet", "Leveret", 
        "Pulselet", "Beeplet", "Bliplet", "Pixelis", "Databit", "Bytelet", "Chiplet", "Processoris", "Memorylet", "Storagelet", "Cloudlet", "Serveris", "Modulet", 
        "Panelet", "Screenlet", "Monitoris", "Keylet", "Mouselet", "Cursoris", "Clicklet", "Scrollet", "Robotlet", "Droidlet", "Androidis", "Cyborglet",
        "Mechanis", "Steamlet", "Pistolet", "Valvelet", "Gaugelet", "Dialette", "Clockwork", "Ticktock", "Winduplet", "Melodis", "Harmonis", "Rhythmlet", "Beatlet", 
        "Tempolis", "Tunelet", "Notelet", "Chordis", "Scalelet", "Pitchlet", "Tonelet", "Octavis", "Soprano", "Altonis", "Tenoris", "Basslet", "Treblelet", 
        "Cleflet", "Stafflet", "Measurelet", "Barlet", "Restlet", "Sharplet", "Flatlet", "Naturalis", "Crescendo", "Diminish", "Fortelet", "Pianolis", "Allegro", 
        "Andante", "Adagio", "Vivace", "Preso", "Lento", "Violinis", "Cellolis", "Violalet", "Bassoon", "Oboelet", "Clarinetis", "Flutelet", "Piccolet", "Trumpetis", 
        "Trombonelet", "Hornlet", "Tubalet", "Drumlet", "Cymbalette"
    ];

const seasonalSpecies = {
  // 2025
  "10-25": ["Cobwebwhisk", "Moonshadow", "Nightfur", "Candlefluff", "Harvestpaw", "Ghostpelt", "Spiritwhisp", "Grimalkin", "Cauldronbubble", "Bonewhisker", "Shadowveil",
     "Hauntwhisk", "Phantomtail", "Grimfur", "Specterpaw", "Duskmist", "Crowfeather", "Wraithpelt", "Tombwhisk", "Blackcat", "Spellweaver", "Candleglow", "Mysticshadow",
     "Ravenwing", "Omenkeeper", "Twilightspell", "Nightshade", "Hexhowl", "Moonspell", "Veilwalker"],
  
  "11-25": ["Maplewhisk", "Rusttail", "Acornpuff", "Leafglimmer", "Windwhisper", "Chestnutpelt", "Smokewing", "Hearthfluff", "Novembermist", "Tawnyfur", "Amberpaw", 
    "Copperleaf", "Fogpelt", "Barkwhisk", "Autumnmist", "Coaltail", "Driftleaf", "Emberfur", "Ravenfeather", "Woodsmoke", "Cozyheart", "Warmember", "Chestnuthowl", 
    "Forestglimmer", "Amberflame", "Gentlefall", "Rustlewhisper", "Softspark", "Goldenrust", "Mellowmoon"],
  
  "12-25": ["Starflake", "Frostlume", "Yuleglow", "Snowtinsel", "Everwhisk", "Glimmerfrost", "Angelwing", "Pinecone", "Winterlight", "Noelwhisk", "Hollywhisk", 
    "Gingersnap", "Mistlepaw", "Crystalbell", "Ivyfur", "Carolwhisk", "Frostnip", "Snowberry", "Joywhisk", "Candlewick", "Sugarplum", "Twinklestar", "Snowkiss", 
    "Cozynog", "Starlightwish", "Frostygem", "Merrysparkle", "Sweetbell", "Joybringer", "Winterwonder"],

  // 2026
  "1-26": ["Glacierpelt", "Chillfur", "Winterbreeze", "Hailclaw", "Icewhisk", "Frostfang", "Snowshoepaw", "Coldnap", "Northwind", "Iciclepelt", "Blizzardpaw", 
    "Frostbite", "Snowcap", "Icedrift", "Whitefur", "Chilltail", "Snowpeak", "Frozenpaw", "Winterfang", "Sleetwhisk", "Crystalfrost", "Polarshine", "Icehowl", 
    "Snowdreamer", "Frostfeather", "Diamonddust", "Winterheart", "Glacialglow", "Shiverlight", "Snowsparkle"],
  
  "2-26": ["Rosewhisp", "Valentwing", "Cherubtail", "Sweetling", "Blushfur", "Lovelace", "Pinkpaw", "Arrowheart", "Passionpelt", "Kindlespark", "Cupidwhisk", 
    "Heartwhisk", "Rosepetal", "Lovewing", "Cherubpaw", "Affection", "Devotion", "Amourpelt", "Embracefur", "Kisswhisk", "Sugarheart", "Candylove", "Rosedragon", 
    "Sweetwhisper", "Loveglow", "Rosysnuggle", "Heartsong", "Cuddlecloud", "Blisswing", "Tenderflame"],
  
  "3-26": ["Thawpaw", "Raindrip", "Dewpetal", "Budfur", "Softbreeze", "Puddlefoot", "Greentip", "Mosspelt", "Sproutwhisk", "Breezefur", "Bloomstart", "Mudpaw", 
    "Rivulet", "Fernwhisk", "Mistpelt", "Drizzlefur", "Seedling", "Raindrop", "Verdantpaw", "Awakening", "Springmist", "Dewdrop", "Gentlerain", "Mossywing", 
    "Puddlejoy", "Greenshimmer", "Mistydawn", "Softsprout", "Rainkiss", "Dewdragon"],
  
  "4-26": ["Cherrywhisk", "Tulipfluff", "Bloomwing", "Gardenpelt", "Leafpetal", "Sproutwing", "Rainpetal", "Sunshower", "Freshleaf", "Meadowbreeze", "Petalfall", 
    "Rosebloom", "Lilacpaw", "Azaleafur", "Violetwhisk", "Birdcall", "Nestling", "Magnolia", "Wisteria", "Primrose", "Cherryblossom", "Tulipheart", "Bunnyhop", 
    "Petalwhisper", "Bloomdragon", "Gardenlight", "Flutterwing", "Songblossom", "Sweetpetal", "Springjoy"],
  
  "5-26": ["Sunraypaw", "Goldenleaf", "Warmwhisk", "Brightfur", "Flowerglint", "Mayflower", "Sunbeam", "Lightstep", "Dandelight", "Cloverpelt", "Dawnbreeze", 
    "Morningdew", "Buttercream", "Goldenglow", "Sunspark", "Bloomfur", "Radiance", "Daybreak", "Luminpaw", "Glowpetal", "Sunnydragon", "Goldenwhisper", 
    "Daisydream", "Honeylight", "Butterflywhisk", "Sunshimmer", "Brightblossom", "Warmglow", "Sunshine", "Lightwhisper"],
  
  "6-26": ["Rainfur", "Thunderpelt", "Boltwhisk", "Lightningtail", "Mistwing", "Summerstorm", "Humidfur", "Galebreath", "Downpour", "Overcastpelt", "Stormcloud",
     "Thunderclap", "Monsoonpaw", "Flashfur", "Rumblewhisk", "Grayclaw", "Tempestfur", "Cloudburst", "Zapwhisk", "Deluge", "Stormdragon", "Thunderhowl", "Rainwhisper",
     "Cloudwing", "Mistyheart", "Lightningstrike", "Skygrowl", "Rainshimmer", "Stormwing", "Thunderglow"],
  
  "7-26": ["Heatfur", "Sunflarepaw", "Cinderwhisk", "Firebreeze", "Moltenpaw", "Solarflare", "Droughtpaw", "Parchedpelt", "Sunscorch", "Ashfur", "Blazepaw", 
    "Inferno", "Swelter", "Heatwave", "Summerhaze", "Scorchwind", "Emberclaw", "Flameglow", "Burnwhisk", "Sizzle", "Sundragon", "Firewhisper", "Lavaheart", 
    "Blazeshine", "Scorchwing", "Summerflare", "Heatglow", "Emberlight", "Flameheart", "Sizzlewhisk"],
  
  "8-26": ["Sunpetal", "Amberflare", "Goldenwhisk", "Warmtail", "Glowfur", "Haybale", "Sunstone", "Augustglow", "Warmwind", "Meadowgold", "Honeywhisk", "Harvestgold", 
    "Wheatstalks", "Goldenray", "Sunripened", "Amberglow", "Latesummer", "Goldenhaze", "Fieldfur", "Grainwhisk", "Honeydragon", "Goldenwing", "Sunnywhisper", "Amberheart",
    "Harvestwing", "Meadowheart", "Warmwhisper", "Goldenheart", "Sunsetglow", "Honeylight"],
  
  "9-26": ["Crimsontail", "Breezewhirl", "Emberleaf", "Twilightpaw", "Hazefur", "Copperleaf", "Equinox", "Harvestmoon", "Chillywhisk", "Acornhide", "Duskfall", 
    "Rustleaf", "Burntorange", "Autumntide", "Fallbreeze", "Scarletwhisk", "Mahogany", "Orangepelt", "Coolpaw", "Septemberfur", "Crimsondust", "Autumnwhisper", 
    "Leafdancer", "Duskdragon", "Harvestwing", "Amberbreeze", "Fallheart", "Twilightwing", "Orangeglow", "Coolbreeze"],
  
  "10-26": ["Pumpkinfur", "Goldenstalk", "Autumnleaf", "Grainpelt", "Spookwhisk", "Hallowtail", "Treatwhisk", "Frightfur", "Lanternpelt", "Ghoulpaw", "Jackolantern",
    "Witchpaw", "Spiderweb", "Scarecrow", "Goblinwhisk", "Screamfur", "Bonepile", "Moonlit", "Hexwhisk", "Cackle", "Pumpkindragon", "Spookywhisper", "Candyhoard", 
    "Trickster", "Moonhowler", "Witchwing", "Shadowpump", "Hallowglow", "Spellwhisk", "Ghostwhisper"],
  
  "11-26": ["Fogwhisper", "Cinnamonpelt", "Cozyfluff", "Gravelpaw", "Duskfeather", "Barebranch", "Coldstone", "Pinepelt", "Frostleaf", "Graypelt", "Pewtertail", 
    "Stonefur", "Barrenwhisk", "Twilightmist", "Drabpelt", "Ashenpaw", "Murkywhisk", "Stormgray", "Thankswhisk", "Feasting", "Cozydragon", "Warmhearth", 
    "Cinnamonwing", "Gratefulheart", "Piewhisper", "Autumncozy", "Foggywhisk", "Thankfulwing", "Hearthglow", "Barebranchwolf"],
  
  "12-26": ["Blizzardwing", "Frostfeather", "Snowdrift", "Iciclemane", "Frostbite", "Silverbell", "Cheerwhisk", "Merrytail", "Peppermintpaw", "Candycane", 
    "Snowglobe", "Wreathpaw", "Garlandfur", "Frostnight", "Bellchime", "Everglow", "Snowflurry", "Jollywhisk", "Giftwrap", "Nutcracker", "Snowdragon", 
    "Candywing", "Jingleheart", "Merryglow", "Frostwhisper", "Yulejoy", "Silverlight", "Hollyjoy", "Snowsprite", "Giftheart"],

  // 2027
  "1-27": ["Crystalpaw", "Permafrost", "Shiverpelt", "Sleettail", "Arcticbreeze", "Freezeclaw", "Deepwinter", "Snowdriftpaw", "Glareice", "Hoarfrost", "Frostshade", 
    "Icepeak", "Coldsnap", "Snowblind", "Frostbite", "Icebound", "Winterchill", "Snowshroud", "Glacialwind", "Frostwhirl", "Icewolf", "Arcticdragon", "Crystalwhisper",
    "Frozenheart", "Wintersparkle", "Snowwhisper", "Iceshine", "Glacierheart", "Frostwing", "Chillfrost"],
  
  "2-27": ["Heartglow", "Cupidpaw", "Adorawhisk", "Fondtail", "Tenderfur", "Smittenfluff", "Dovewing", "Charmfur", "Romancepelt", "Cuddlewhisk", "Sweetheart", 
    "Truelove", "Rosywhisk", "Darlingpaw", "Affectionfur", "Crushwhisk", "Lovebird", "Heartbeat", "Valentina", "Belovedpelt", "Lovedragon", "Sweetwhisper", 
    "Heartflutter", "Cuddleheart", "Rosywolf", "Valentinewing", "Kisswhisper", "Lovesparkle", "Charmwing", "Adoration"],
  
  "3-27": ["Sproutling", "Mistglow", "Petalrain", "Bloomdew", "Gentlebreeze", "Crocuspelt", "Thawfur", "Riverswell", "Newleaf", "Springstep", "Rebirthpaw", 
    "Verdant", "Emeraldwhisk", "Freshness", "Clearpaw", "Renewfur", "Budbreak", "Sapwhisk", "Growthpelt", "Lifepaw", "Springdragon", "Dewwhisper", "Mossywhisper", 
    "Budwolf", "Greenglow", "Mistwhisper", "Renewheart", "Springwing", "Verdantwolf", "Freshwhisk"],
  
  "4-27": ["Dandelion", "Robinwing", "Meadowpelt", "Violetpaw", "Nestwhisk", "Bluebell", "Daffodil", "Bunnypaw", "Chickadee", "Grasswhisk", "Irispelt", "Hyacinth", 
    "Songbird", "Eggshell", "Lambpaw", "Springfawn", "Aprilrain", "Peachblossom", "Pastelpaw", "Dewdrop", "Blossomdragon", "Robinwhisper", "Meadowheart", 
    "Violetglow", "Nestling", "Bluebellwing", "Daffodilheart", "Bunnyheart", "Softspring", "Petalwhisper"],
  
  "5-27": ["Daisyfur", "Buttercup", "Solwhisk", "Lumetail", "Beamglow", "Brightwing", "Sunnypelt", "Pollenfluff", "Honeybee", "Glimmerwing", "Sunwhisker", 
    "Radiantpaw", "Goldburst", "Lightwhisk", "Shimmerfur", "Daylily", "Sunsprite", "Brilliance", "Lumiwhisk", "Sparkpelt", "Daisydragon", "Buttercupwolf", 
    "Sunnywhisper", "Beamheart", "Brightheart", "Honeywhisper", "Glimmerheart", "Radiantwing", "Sparkledust", "Lightglow"],
  
  "6-27": ["Tempestwing", "Drizzlepaw", "Cloudwhirl", "Stormgust", "Skytail", "Skyfire", "Summerbreeze", "Solsticepaw", "Longday", "Sunwing", "Rainmaker", 
    "Wetfur", "Thundersky", "Graycloud", "Mistfall", "Showerpaw", "Windblown", "Rainswept", "Stormpelt", "Juneshower", "Tempestdragon", "Stormwhisper", 
    "Rainheart", "Cloudwing", "Thunderwolf", "Mistwhisper", "Summerstorm", "Skywing", "Drizzleheart", "Stormglow"],
  
  "7-27": ["Scorchdust", "Flamepaw", "Blazeheart", "Embertail", "Sunblaze", "Warmstone", "Lavapelt", "Desertwind", "Suncrystal", "Firefly", "Heatsear", 
    "Wildfirewhisk", "Sandscorch", "Mirage", "Burnfur", "Summerpeak", "Flashfire", "Pyropaw", "Searwhisk", "Flareup", "Flamedragon", "Scorchwolf", "Emberheart", 
    "Lavawing", "Blazewhisper", "Heatwave", "Fireheart", "Scorchglow", "Summerheat", "Wildfireheart"],
  
  "8-27": ["Goldenhour", "Harvestglow", "Wheatwhisk", "Honeypelt", "Sunsettail", "Cicadawing", "Cornhusk", "Goldensun", "Dustdevil", "Sunsoak", "Summersend", 
    "Ripenfur", "Fieldgold", "Amberlight", "Sundown", "Grainfield", "Goldenbreeze", "Harvesthaze", "Mellowwhisk", "Amberhour", "Goldendragon", "Harvestwolf", 
    "Honeyglow", "Sunsetwing", "Wheatwhisper", "Amberwing", "Goldenheart", "Mellowglow", "Sunsoaked", "Harvestjoy"],
  
  "9-27": ["Bronzeleaf", "Chillwind", "Rustwhisper", "Hearthglow", "Scarletpaw", "Harvestpelt", "Marigold", "Applefur", "Spicebreeze", "Septembermist", 
    "Ciderwhisk", "Applepaw", "Cinnabar", "Earthtone", "Goldenfall", "Redleaf", "Nutmeg", "Orchardwhisk", "Fallglow", "Spicepelt", "Bronzedragon", "Appleheart", 
    "Spicewolf", "Ciderwhisper", "Marigoldwing", "Autumnwhisper", "Hearthwing", "Scarletwolf", "Orchardglow", "Fallheart"],
  
  "10-27": ["Jackpaw", "Witchwhisk", "Moonhowl", "Shadowtail", "Tricktail", "Batwing", "Cryptclaw", "Monsterfur", "Spellbound", "Candyhoard", "Darkspell", 
    "Nightcreep", "Wickedwhisk", "Zombiepaw", "Ghastly", "Hauntpelt", "Sinister", "Creepwhisk", "Eeriefur", "Macabre", "Moondragon", "Witchwolf", "Shadowwhisper", 
    "Spellwing", "Batwhisper", "Hauntedwing", "Spookheart", "Trickwing", "Nightspell", "Cryptglow"],
  
  "11-27": ["Cinderfall", "Frostmist", "Graymane", "Overcast", "Sleepywhisk", "Thankfulpaw", "Feastfur", "Gratefulwhisk", "Nutmegpelt", "Sweaterfluff", "Blessingpaw",
    "Turkeywhisk", "Piefur", "Autumnhush", "Barepelt", "Gratefulness", "Warmfireside", "Cozywhisk", "Thankswhisk", "Novembernight", "Cozydragon", "Thankfulheart", 
    "Feastglow", "Gratefulwing", "Nutmegwolf", "Pieheart", "Warmwhisper", "Blessedwing", "Hearthdragon", "Snugglewhisk"],
  
  "12-27": ["Tinselwing", "Hollyberry", "Carolpaw", "Giftglow", "Mistletoe", "Jinglepaw", "Ribbonwhisk", "Wreathfur", "Starlight", "Chimneysoot", "Stockingpaw", "Frostedpane",
    "Snowangel", "Yulewhisk", "Wishmake", "Festivefur", "Ornament", "Garlandpaw", "Sleighbell", "Merrywhisk", "Tinseldragon", "Hollywolf", "Carolheart", "Giftwing",
    "Mistletoewolf", "Jingleheart", "Ribbonglow", "Wreathwing", "Stardragon", "Festiveheart"]
};

let speciesByArea = createSpeciesDistribution(speciesPool, seasonalSpecies);

function migrateDuplicateSpecies() {
  if (!dreamBook) return;
  
  const seenSpecies = new Set();
  const duplicates = [];
  
  // First pass: identify duplicates (case-insensitive)
  for (const key in dreamBook) {
    const lowerKey = key.toLowerCase();
    if (seenSpecies.has(lowerKey)) {
      duplicates.push(key);
    } else {
      seenSpecies.add(lowerKey);
    }
  }
  
  // Second pass: merge duplicates
  for (const dupKey of duplicates) {
    const lowerKey = dupKey.toLowerCase();
    
    // Find the canonical (first) version of this species
    let canonicalKey = null;
    for (const key in dreamBook) {
      if (key.toLowerCase() === lowerKey && key !== dupKey) {
        canonicalKey = key;
        break;
      }
    }
    
    if (!canonicalKey) continue;
    
    // Merge the duplicate into the canonical entry
    const dupData = dreamBook[dupKey];
    const canonicalData = dreamBook[canonicalKey];
    
    for (const rarity in dupData) {
      if (!canonicalData[rarity]) {
        canonicalData[rarity] = dupData[rarity];
      } else {
        for (const rank in dupData[rarity]) {
          if (!canonicalData[rarity][rank]) {
            canonicalData[rarity][rank] = dupData[rarity][rank];
          } else {
            // Merge: keep collected if either is collected, keep star if either has star
            const dupEntry = dupData[rarity][rank];
            const canonEntry = canonicalData[rarity][rank];
            
            if (dupEntry.collected && !canonEntry.collected) {
              canonEntry.collected = true;
              canonEntry.firstCollectedDate = dupEntry.firstCollectedDate;
            }
            
            if (dupEntry.isStar) {
              canonEntry.isStar = true;
            }
          }
        }
      }
    }
    
    // Remove the duplicate
    delete dreamBook[dupKey];
    console.log(`Merged duplicate: ${dupKey} → ${canonicalKey}`);
  }
  
  if (duplicates.length > 0) {
    console.log(`Removed ${duplicates.length} duplicate species from dream book`);
    saveGame();
  }
}

// --- Migration: Rename "Deerling" species to "Deerlass" ---
function migrateSpeciesNames(data) {
  const renameMap = {
    "Deerling": "Deerlass"
  };

  const renameSpecies = (dreamling) => {
    if (dreamling && renameMap[dreamling.species]) {
      dreamling.species = renameMap[dreamling.species];
    }
  };

  // Apply to all dreamling collections
  (data.partyDreamlings || []).forEach(renameSpecies);
  (data.trainingDreamlings || []).forEach(renameSpecies);
  (data.storageDreamlings || []).forEach(renameSpecies);
  (data.ascendedDreamlings || []).forEach(renameSpecies);
  (data.ranchDreamling || []).forEach(renameSpecies);

  // Apply to dream book entries too
  if (data.dreamBook) {
    for (const key in data.dreamBook) {
      const newKey = renameMap[key];
      if (newKey) {
        data.dreamBook[newKey] = data.dreamBook[key];
        delete data.dreamBook[key];
      }
    }
  }

  console.log("Species name migration completed (Deerling → Deerlass)");
}
//#endregion

//#region DREAMLING TAB
// Sorting functions
function sortDreamlings(array, sortBy) {
    const sorted = [...array];
    
    const rarityOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 };
    
    switch(sortBy) {
        case 'species':
            // Species -> Rarity -> Rank -> Level -> XP
            sorted.sort((a, b) => {
                if (a.species !== b.species) return a.species.localeCompare(b.species);
                if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) return rarityOrder[a.rarity] - rarityOrder[b.rarity];
                if (a.rank !== b.rank) return a.rank.localeCompare(b.rank);
                if (a.level !== b.level) return b.level - a.level;
                return b.xp - a.xp;
            });
            break;
            
        case 'rarity':
            // Rarity -> Rank -> Level -> XP
            sorted.sort((a, b) => {
                if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) return rarityOrder[b.rarity] - rarityOrder[a.rarity];
                if (a.rank !== b.rank) return b.rank.localeCompare(a.rank);
                if (a.level !== b.level) return b.level - a.level;
                return b.xp - a.xp;
            });
            break;
            
        case 'rank':
            // Rank -> Rarity -> Level -> XP
            sorted.sort((a, b) => {
                if (a.rank !== b.rank) return b.rank.localeCompare(a.rank);
                if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) return rarityOrder[b.rarity] - rarityOrder[a.rarity];
                if (a.level !== b.level) return b.level - a.level;
                return b.xp - a.xp;
            });
            break;
            
        case 'level':
            // Level -> XP -> Rarity -> Rank
            sorted.sort((a, b) => {
                if (a.level !== b.level) return b.level - a.level;
                if (a.xp !== b.xp) return b.xp - a.xp;
                if (rarityOrder[a.rarity] !== rarityOrder[b.rarity]) return rarityOrder[b.rarity] - rarityOrder[a.rarity];
                return b.rank.localeCompare(a.rank);
            });
            break;
    }
    
    return sorted;
}

function renderSection(section, listId, countId, array) {
    const container = document.getElementById(listId);
    if (!container) {
        console.warn(`Container not found for id: ${listId}`);
        return;
    }
    container.innerHTML = "";

    const sectionWrapper = container.parentElement;
    const header = sectionWrapper.querySelector("h3");

    // --- Create filter buttons once ---
    let buttonsWrapper = sectionWrapper.querySelector(".filter-buttons");
    if (!buttonsWrapper) {
        buttonsWrapper = document.createElement("div");
        buttonsWrapper.className = "filter-buttons";
        buttonsWrapper.style.display = "flex";
        buttonsWrapper.style.gap = "6px";
        buttonsWrapper.style.margin = "6px 0";
        buttonsWrapper.style.flexWrap = "wrap";
        header.insertAdjacentElement("afterend", buttonsWrapper);

        // Rarity label
        const rarityLabel = document.createElement("span");
        rarityLabel.textContent = "Rarity:";
        rarityLabel.style.fontWeight = "bold";
        rarityLabel.style.alignSelf = "center";
        rarityLabel.style.marginRight = "4px";
        buttonsWrapper.appendChild(rarityLabel);

        // "All" button
        const allBtn = document.createElement("button");
        allBtn.className = "move-btn filter-btn";
        allBtn.textContent = "All";
        allBtn.dataset.filterType = "rarity";
        allBtn.addEventListener("click", () => {
            dreamlingFilterState[section].rarity = null;
            updateFilterButtons(section);
            filterAndRender(section, listId, countId);
        });
        buttonsWrapper.appendChild(allBtn);

        // Rarity filter buttons
        const rarityKeys = ["common", "uncommon", "rare", "epic", "legendary"];
        rarityKeys.forEach(rarity => {
            const btn = document.createElement("button");
            btn.className = "move-btn filter-btn";
            btn.textContent = capitalize(rarity);
            btn.dataset.rarity = rarity;
            btn.dataset.filterType = "rarity";
            
            btn.addEventListener("click", () => {
                dreamlingFilterState[section].rarity = rarity;
                updateFilterButtons(section);
                filterAndRender(section, listId, countId);
            });

            buttonsWrapper.appendChild(btn);
        });

        // Spacer
        const spacer1 = document.createElement("div");
        spacer1.style.width = "100%";
        spacer1.style.height = "4px";
        buttonsWrapper.appendChild(spacer1);

        // Special filters label
        const specialLabel = document.createElement("span");
        specialLabel.textContent = "Filters:";
        specialLabel.style.fontWeight = "bold";
        specialLabel.style.alignSelf = "center";
        specialLabel.style.marginRight = "4px";
        buttonsWrapper.appendChild(specialLabel);

        // Star filter button (3-state)
        const starBtn = document.createElement("button");
        starBtn.className = "move-btn filter-btn";
        starBtn.textContent = "Stars";
        starBtn.dataset.filterType = "star";
        starBtn.addEventListener("click", () => {
            const current = dreamlingFilterState[section].star;
            if (current === 'all') dreamlingFilterState[section].star = 'only';
            else if (current === 'only') dreamlingFilterState[section].star = 'exclude';
            else dreamlingFilterState[section].star = 'all';
            updateFilterButtons(section);
            filterAndRender(section, listId, countId);
        });
        buttonsWrapper.appendChild(starBtn);

        // Event filter button (3-state)
        const eventBtn = document.createElement("button");
        eventBtn.className = "move-btn filter-btn";
        eventBtn.textContent = "Events";
        eventBtn.dataset.filterType = "event";
        eventBtn.addEventListener("click", () => {
            const current = dreamlingFilterState[section].event;
            if (current === 'all') dreamlingFilterState[section].event = 'only';
            else if (current === 'only') dreamlingFilterState[section].event = 'exclude';
            else dreamlingFilterState[section].event = 'all';
            updateFilterButtons(section);
            filterAndRender(section, listId, countId);
        });
        buttonsWrapper.appendChild(eventBtn);

        // Traded filter button (3-state)
        const tradedBtn = document.createElement("button");
        tradedBtn.className = "move-btn filter-btn";
        tradedBtn.textContent = "Traded";
        tradedBtn.dataset.filterType = "traded";
        tradedBtn.addEventListener("click", () => {
            const current = dreamlingFilterState[section].traded;
            if (current === 'all') dreamlingFilterState[section].traded = 'only';
            else if (current === 'only') dreamlingFilterState[section].traded = 'exclude';
            else dreamlingFilterState[section].traded = 'all';
            updateFilterButtons(section);
            filterAndRender(section, listId, countId);
        });
        buttonsWrapper.appendChild(tradedBtn);

        // Spacer
        const spacer2 = document.createElement("div");
        spacer2.style.width = "100%";
        spacer2.style.height = "4px";
        buttonsWrapper.appendChild(spacer2);

        // Sort label
        const sortLabel = document.createElement("span");
        sortLabel.textContent = "Sort by:";
        sortLabel.style.fontWeight = "bold";
        sortLabel.style.alignSelf = "center";
        sortLabel.style.marginRight = "4px";
        buttonsWrapper.appendChild(sortLabel);

        // Sort buttons
        const sortOptions = [
            { value: 'species', label: 'Species' },
            { value: 'rarity', label: 'Rarity' },
            { value: 'rank', label: 'Rank' },
            { value: 'level', label: 'Level' }
        ];

        sortOptions.forEach(option => {
            const btn = document.createElement("button");
            btn.className = "move-btn sort-btn";
            btn.textContent = option.label;
            btn.dataset.sortType = option.value;
            btn.addEventListener("click", () => {
                dreamlingSortState[section] = option.value;
                updateFilterButtons(section);
                filterAndRender(section, listId, countId);
            });
            buttonsWrapper.appendChild(btn);
        });
    }

    // Update button styles
    updateFilterButtons(section);

    // --- Render cards ---
    array.forEach(d => {
        const card = createDreamlingCard(d, section, container);
        container.appendChild(card);
    });

    // --- Update count ---
    let max = 0;
    let fullArrayLength = 0;
    switch(section) {
        case "party": 
            max = maxPartySize;
            fullArrayLength = partyDreamlings.length;
            break;
        case "training": 
            max = maxTrainingSize;
            fullArrayLength = trainingDreamlings.length;
            break;
        case "storage": 
            max = maxStorageSize;
            fullArrayLength = storageDreamlings.length;
            break;
        case "ranch": 
            max = maxRanchSize;
            fullArrayLength = ranchDreamling.length;
            break;
    }
    document.getElementById(countId).textContent = `${fullArrayLength}/${max}`;
}

function updateFilterButtons(section) {
    const sectionWrapper = document.getElementById(`${section}-list`).parentElement;
    const buttonsWrapper = sectionWrapper.querySelector(".filter-buttons");
    if (!buttonsWrapper) return;

    const filterState = dreamlingFilterState[section];
    const sortState = dreamlingSortState[section];

    // Update rarity filter buttons
    const rarityButtons = buttonsWrapper.querySelectorAll('[data-filter-type="rarity"]');
    rarityButtons.forEach(btn => {
        const btnRarity = btn.dataset.rarity;
        const isActive = (filterState.rarity === null && btn.textContent === "All") ||
                        (filterState.rarity === btnRarity);
        
        if (isActive) {
            btn.style.fontWeight = "bold";
            btn.style.opacity = "1";
            btn.style.backgroundColor = "#4caf50";
        } else {
            btn.style.fontWeight = "normal";
            btn.style.opacity = "0.6";
            btn.style.backgroundColor = "";
        }
    });

    const starBtn = buttonsWrapper.querySelector('[data-filter-type="star"]');
    if (starBtn) {
        const state = filterState.star;
        if (state === 'only') {
            starBtn.textContent = "Stars ONLY";
            starBtn.style.fontWeight = "bold";
            starBtn.style.backgroundColor = "#ffd700";
            starBtn.style.color = "#111";
        } else if (state === 'exclude') {
            starBtn.textContent = "Stars OFF";
            starBtn.style.fontWeight = "bold";
            starBtn.style.backgroundColor = "#666";
            starBtn.style.color = "#fff";
        } else {
            starBtn.textContent = "Stars";
            starBtn.style.fontWeight = "normal";
            starBtn.style.backgroundColor = "";
            starBtn.style.color = "";
        }
    }

    // Update event filter button
    const eventBtn = buttonsWrapper.querySelector('[data-filter-type="event"]');
    if (eventBtn) {
        const state = filterState.event;
        if (state === 'only') {
            eventBtn.textContent = "Events ONLY";
            eventBtn.style.fontWeight = "bold";
            eventBtn.style.backgroundColor = "#ff6b6b";
            eventBtn.style.color = "#fff";
        } else if (state === 'exclude') {
            eventBtn.textContent = "Events OFF";
            eventBtn.style.fontWeight = "bold";
            eventBtn.style.backgroundColor = "#666";
            eventBtn.style.color = "#fff";
        } else {
            eventBtn.textContent = "Events";
            eventBtn.style.fontWeight = "normal";
            eventBtn.style.backgroundColor = "";
            eventBtn.style.color = "";
        }
    }

    // Update traded filter button
    const tradedBtn = buttonsWrapper.querySelector('[data-filter-type="traded"]');
    if (tradedBtn) {
        const state = filterState.traded;
        if (state === 'only') {
            tradedBtn.textContent = "Traded ONLY";
            tradedBtn.style.fontWeight = "bold";
            tradedBtn.style.backgroundColor = "#ffa500";
            tradedBtn.style.color = "#fff";
        } else if (state === 'exclude') {
            tradedBtn.textContent = "Traded OFF";
            tradedBtn.style.fontWeight = "bold";
            tradedBtn.style.backgroundColor = "#666";
            tradedBtn.style.color = "#fff";
        } else {
            tradedBtn.textContent = "Traded";
            tradedBtn.style.fontWeight = "normal";
            tradedBtn.style.backgroundColor = "";
            tradedBtn.style.color = "";
        }
    }

    // Update sort buttons
    const sortButtons = buttonsWrapper.querySelectorAll('.sort-btn');
    sortButtons.forEach(btn => {
        const isActive = sortState === btn.dataset.sortType;
        if (isActive) {
            btn.style.fontWeight = "bold";
            btn.style.backgroundColor = "#2196f3";
            btn.style.color = "#fff";
        } else {
            btn.style.fontWeight = "normal";
            btn.style.backgroundColor = "";
            btn.style.color = "";
        }
    });
}

function filterAndRender(section, listId, countId) {
    const sourceArray = sectionMap[section]?.();
    if (!sourceArray) return;

    let displayArray = [...sourceArray];
    const filterState = dreamlingFilterState[section];
    
    // Filter by rarity
    if (filterState.rarity) {
        displayArray = displayArray.filter(d => d.rarity === filterState.rarity);
    }

    // Filter by star (3-state)
    if (filterState.star === 'only') {
        displayArray = displayArray.filter(d => d.isStar === true);
    } else if (filterState.star === 'exclude') {
        displayArray = displayArray.filter(d => !d.isStar);
    }

    // Filter by event (3-state)
    if (filterState.event === 'only') {
        displayArray = displayArray.filter(d => d.isEvent === true);
    } else if (filterState.event === 'exclude') {
        displayArray = displayArray.filter(d => !d.isEvent);
    }

    // Filter by traded (3-state)
    if (filterState.traded === 'only') {
        displayArray = displayArray.filter(d => d.isTraded === true);
    } else if (filterState.traded === 'exclude') {
        displayArray = displayArray.filter(d => !d.isTraded);
    }

    // Filter out pending trades in storage
    if (section === "storage") {
        displayArray = displayArray.filter(d => !d.pendingTrade);
    }

    // Sort the array
    const sortBy = dreamlingSortState[section];
    displayArray = sortDreamlings(displayArray, sortBy);

    renderSection(section, listId, countId, displayArray);
}

// Utility function
function capitalize(str){
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function createDreamlingCard(d, section) {
    const card = document.createElement("div");
    card.className = "dreamling-card";
    card.style.backgroundColor = "#636363ff";
    card.style.borderRadius = "10px";
    card.style.border = `2px solid ${rarities[d.rarity].displayColor}`;
    card.style.padding = "10px";
    card.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.alignItems = "center";
    card.style.position = "relative";
    card.style.overflow = "hidden";
    card.style.minWidth = "275px";

    // Header
    const header = document.createElement("div");
    header.style.backgroundColor = rarities[d.rarity].displayColor;
    header.style.color = "#111";
    header.style.fontWeight = "bold";
    header.style.textAlign = "center";
    header.style.padding = "8px 0";
    header.style.fontSize = "1em";
    header.style.minHeight = "20px";
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "center";
    header.style.width = "95%";
    header.style.margin = "0 auto";
    header.textContent = `${d.isStar ? "⭐ " : ""}${capitalize(d.rarity)} ${d.rank}`;
    card.appendChild(header);

    // Species
    const speciesDiv = document.createElement("div");
    speciesDiv.style.textAlign = "center";
    speciesDiv.style.margin = "8px 0";
    speciesDiv.style.fontWeight = "bold";
    speciesDiv.textContent = d.species;
    card.appendChild(speciesDiv);

    // Level and XP bar
    const { currentXP, maxXP } = getLevelXP(d);
    const levelDiv = document.createElement("div");
    levelDiv.textContent = `Level ${d.level} (${Math.floor(currentXP).toLocaleString()} / ${Math.floor(maxXP).toLocaleString()})`;
    card.appendChild(levelDiv);

    const xpBar = document.createElement("div");
    xpBar.style.background = "#ccc";
    xpBar.style.width = "90%";
    xpBar.style.height = "8px";
    xpBar.style.borderRadius = "4px";
    xpBar.style.overflow = "hidden";
    xpBar.style.margin = "3px auto";

    const xpFill = document.createElement("div");
    xpFill.style.background = "linear-gradient(to right, #4caf50, #8bc34a)";
    xpFill.style.width = `${d.level === d.maxLevel ? 100 : Math.min((currentXP / maxXP) * 100, 100)}%`;
    xpFill.style.height = "100%";
    xpFill.style.transition = "width 0.5s";
    xpBar.appendChild(xpFill);
    card.appendChild(xpBar);

    // Boosts
    const uniqueBoosts = [...new Map(d.bonusBoosts.map(b => [b.type, b])).values()];
    const boostsDiv = document.createElement("div");
    boostsDiv.style.margin = "5px 0";

    boostsDiv.innerHTML = uniqueBoosts.map(b => {
      const displayName = BoostDisplayNames[b.type] ?? b.type;
      const baseValue = getDreamlingBoost(d); // ✅ use shared logic
      return `<div>${displayName}: +${baseValue.toFixed(2)}%</div>`;
    }).join("");

    card.appendChild(boostsDiv);

    // Move buttons
    const moveButtonsDiv = document.createElement("div");
    moveButtonsDiv.style.marginTop = "5px";
    moveButtonsDiv.style.display = "flex";
    moveButtonsDiv.style.justifyContent = "center";
    moveButtonsDiv.style.flexWrap = "wrap";
    moveButtonsDiv.style.gap = "3px";

    function createMoveButton(label, targetSection) {
        const btn = document.createElement("button");
        btn.className = "move-btn";
        btn.textContent = label;

        let targetArray, maxSize;
        switch(targetSection) {
            case "party": targetArray = partyDreamlings; maxSize = maxPartySize; break;
            case "training": targetArray = trainingDreamlings; maxSize = maxTrainingSize; break;
            case "storage": targetArray = storageDreamlings; maxSize = maxStorageSize; break;
        }

        btn.disabled = !targetArray || targetArray.length >= maxSize;

        // Capture dreamling ID and section at creation
        const dreamlingId = d.id;
        const currentSection = section;

        btn.addEventListener("click", () => {
            moveDreamling(dreamlingId, currentSection, targetSection);
        });

        return btn;
    }

    if (section !== "party") moveButtonsDiv.appendChild(createMoveButton("Party", "party"));
    if (section !== "training") moveButtonsDiv.appendChild(createMoveButton("Training", "training"));
    if (section !== "storage") moveButtonsDiv.appendChild(createMoveButton("Storage", "storage"));

    card.appendChild(moveButtonsDiv);

    // Max Potion button
    const maxPotionDiv = document.createElement("div");
    maxPotionDiv.style.marginTop = "5px";
    maxPotionDiv.style.display = "flex";
    maxPotionDiv.style.justifyContent = "center";
    const maxPotionBtn = document.createElement("button");
    maxPotionBtn.className = "move-btn";
    maxPotionBtn.textContent = `Max Potion (${maxPotions})`;
    maxPotionBtn.disabled = maxPotions <= 0;
    maxPotionBtn.onclick = () => {
        if (maxPotions > 0) {
            showConfirm(
                `Use a Max Potion to instantly level ${d.species} to level ${d.maxLevel}?`,
                () => {
                    d.level = d.maxLevel;
                    d.xp = 0;
                    maxPotions--;
                    renderAllSections();
                }
            );
        }
    };
    maxPotionDiv.appendChild(maxPotionBtn);
    card.appendChild(maxPotionDiv);

    // Ascend button
    if (canAscend(d)) {
        const ascendBtn = document.createElement("button");
        ascendBtn.className = "ascend-btn";
        ascendBtn.textContent = "Ascend";
        ascendBtn.style.marginTop = "5px";
        ascendBtn.style.backgroundColor = "#8e44ad";
        ascendBtn.style.color = "#fff";
        ascendBtn.style.border = "none";
        ascendBtn.style.padding = "4px 8px";
        ascendBtn.style.borderRadius = "6px";
        ascendBtn.style.cursor = "pointer";
        ascendBtn.onclick = () => {
            showConfirm(
                `Are you sure you want to ascend ${d.species}? The Dreamling will be removed from play forever, but its boosts will go up and it'll be added to your 
                permanent boosts.`,
                () => ascendDreamling(d)
            );
        };
        card.appendChild(ascendBtn);
    }

    // Release button
    const buttonsDiv = document.createElement("div");
    buttonsDiv.style.display = "flex";
    buttonsDiv.style.justifyContent = "center";
    buttonsDiv.style.marginTop = "5px";
    buttonsDiv.style.flexWrap = "wrap";
    buttonsDiv.style.gap = "6px";

    const releaseBtn = document.createElement("button");
    releaseBtn.className = "release-btn";
    releaseBtn.textContent = "Release";
    releaseBtn.disabled = section === "party" && partyDreamlings.length === 1;
    releaseBtn.onclick = () => releaseDreamling(d.id, section);
    buttonsDiv.appendChild(releaseBtn);

    if (section === "storage") { 
      const tradeDiv = document.createElement("div"); 
      tradeDiv.style.display = "flex"; 
      tradeDiv.style.alignItems = "center"; 
      tradeDiv.style.gap = "6px"; 
      
      function renderExportButton() { 
        tradeDiv.innerHTML = ""; 
        if (!d.isTraded) { 
          const exportBtn = document.createElement("button"); 
          exportBtn.className = "export-btn"; 
          exportBtn.textContent = "Export"; 
          exportBtn.style.backgroundColor = "#3399FF"; 
          exportBtn.style.color = "#fff"; 
          exportBtn.style.border = "none"; 
          exportBtn.style.padding = "6px 12px"; 
          exportBtn.style.borderRadius = "6px"; 
          exportBtn.style.cursor = "pointer"; 
          exportBtn.onclick = () => { 
            exportDreamlingSafe(d.id); 
            renderExportButton(); 
          }; 
          tradeDiv.appendChild(exportBtn); 
        } 
      } 
      
      renderExportButton(); 
      buttonsDiv.appendChild(tradeDiv);  // <-- Changed from buttonsWrapper to buttonsDiv
    }
    
    card.appendChild(buttonsDiv);

    // TRADED banner 
    if (d.isTraded) { 
      const banner = document.createElement("div"); 
      banner.textContent = "TRADED"; 
      banner.style.position = "absolute"; 
      banner.style.top = "10px"; 
      banner.style.left = "-40px"; 
      banner.style.width = "120px"; 
      banner.style.backgroundColor = "rgba(255,215,0,0.85)"; 
      banner.style.color = "#111"; 
      banner.style.fontWeight = "bold"; 
      banner.style.fontSize = "0.75em"; 
      banner.style.textAlign = "center"; 
      banner.style.transform = "rotate(-45deg)"; 
      banner.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)"; 
      card.appendChild(banner);
    } 
      
    // Event banner 
    if (d.isEvent) { 
      const banner = document.createElement("div"); 
      banner.textContent = d.eventIdentity; 
      banner.style.position = "absolute"; 
      banner.style.top = "10px"; 
      banner.style.right = "-40px"; 
      banner.style.width = "120px"; 
      banner.style.backgroundColor = "rgba(255,0,0,0.8)"; 
      banner.style.color = "#fff"; 
      banner.style.fontWeight = "bold"; 
      banner.style.fontSize = "0.75em"; 
      banner.style.textAlign = "center"; 
      banner.style.transform = "rotate(45deg)"; 
      banner.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)"; 
      card.appendChild(banner); 
    }

    return card;
}

function renderAllSections() {
    filterAndRender("party", "party-list", "party-count");
    filterAndRender("training", "training-list", "training-count");
    filterAndRender("storage", "storage-list", "storage-count");

    renderPendingTradesSafe();
    renderPartyBoosts();
}

function renderPartyBoosts() {
  const container = document.getElementById("party-boosts");
  if (!container) return console.warn("party-boosts container missing");

  container.innerHTML = "";

  if (!partyDreamlings || partyDreamlings.length === 0) {
    container.innerHTML = "<p>No active boosts — your party is empty.</p>";
    return;
  }

  const totalBoosts = {};

  // --- Calculate boosts from partyDreamlings ---
  partyDreamlings.forEach(d => {
    const baseBoost = Number(getDreamlingBoost(d)) || 0;

    if (!d.bonusBoosts) return;

    if (Array.isArray(d.bonusBoosts)) {
      d.bonusBoosts.forEach(b => {
        const type = b.type;
        if (!type) return;
        totalBoosts[type] = (totalBoosts[type] || 0) + baseBoost;
      });
    } else if (typeof d.bonusBoosts === "object") {
      for (const [type, value] of Object.entries(d.bonusBoosts)) {
        const total = baseBoost * (Number(value) || 1);
        totalBoosts[type] = (totalBoosts[type] || 0) + total;
      }
    }
  });

  if (Object.keys(totalBoosts).length === 0) {
    container.innerHTML = "<p>No boosts from current Dreamlings.</p>";
    console.warn("No boosts found — check bonusBoosts format on your Dreamlings");
    return;
  }

  // --- Render party boost cards ---
  Object.entries(totalBoosts).forEach(([boostType, total], i) => {
    const card = document.createElement("div");
    card.className = "boost-card";

    const name = BoostDisplayNames[boostType] || boostType;

    // Include permanentBoosts in smaller font if available
    const permValue = permanentBoosts[boostType] || 0;

    card.innerHTML = `
      <h4>${name}</h4>
      <p>+${total.toFixed(2)}%</p>
      ${permValue ? `<p style="font-size:0.75em; color:#ccc;">+${permValue.toFixed(2)}% from Ascension</p>` : ""}
    `;

    container.appendChild(card);
  });
}
//#endregion

//#region ASCENSION
const canAscend = (d) => {
    return d.level === d.maxLevel &&
           d.isStar &&
           d.rarity === "legendary" &&
           d.rank === "T5";
};

function ascendDreamling(dreamling) {
  // Remove Dreamling from all current arrays
  partyDreamlings = partyDreamlings.filter(x => x.id !== dreamling.id);
  trainingDreamlings = trainingDreamlings.filter(x => x.id !== dreamling.id);
  storageDreamlings = storageDreamlings.filter(x => x.id !== dreamling.id);

  // Add to ascendedDreamlings array
  ascendedDreamlings.push(dreamling);

  // Recalculate all permanent boosts from scratch
  permanentBoosts = {};

  for (const d of ascendedDreamlings) {
    const rarityData = rarities[d.rarity];
    if (!rarityData) continue;

    // Always use level 333 for ascended boost calculation
    const cappedBoost = rarityData.baseBoost + (rarityData.levelBoost * 333);

    // Add each bonus type to total
    for (const bonus of d.bonusBoosts || []) {
      const key = bonus.type;
      permanentBoosts[key] = (permanentBoosts[key] || 0) + cappedBoost;
    }
  }

  // UI updates
  renderTrophyHall();
  renderAllSections();
  showMessage(`${dreamling.species} has ascended!`);
}

function createTrophyHallCard(d) {
    const card = document.createElement("div");
    card.className = "dreamling-card";
    card.style.backgroundColor = "#636363ff";
    card.style.borderRadius = "10px";
    card.style.border = `2px solid ${rarities[d.rarity].displayColor}`;
    card.style.padding = "10px";
    card.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.alignItems = "center";
    card.style.position = "relative";
    card.style.overflow = "hidden";
    card.style.width = "250px"; // was probably 250px

    // Header with rarity/tier and star
    const header = document.createElement("div");
    header.style.backgroundColor = rarities[d.rarity].displayColor;
    header.style.color = "#111";
    header.style.fontWeight = "bold";
    header.style.textAlign = "center";
    header.style.padding = "8px 0";
    header.style.fontSize = "1em";
    header.style.minHeight = "20px";
    header.style.display = "flex";
    header.style.alignItems = "center";
    header.style.justifyContent = "center";
    header.style.width = "95%";
    header.style.margin = "0 auto";
    header.textContent = `${d.isStar ? "⭐ " : ""}${capitalize(d.rarity)} ${d.rank}`;
    card.appendChild(header);

    // Species
    const speciesDiv = document.createElement("div");
    speciesDiv.style.textAlign = "center";
    speciesDiv.style.margin = "8px 0";
    speciesDiv.style.fontWeight = "bold";
    speciesDiv.textContent = d.species;
    card.appendChild(speciesDiv);

    // Level and XP bar
    const { currentXP, maxXP } = getLevelXP(d);
    const levelDiv = document.createElement("div");
    levelDiv.textContent = `Level ${d.level}`;
    card.appendChild(levelDiv);

    // Boosts
    const uniqueBoosts = [...new Map(d.bonusBoosts.map(b => [b.type, b])).values()];
    const boostsDiv = document.createElement("div");
    boostsDiv.style.margin = "5px 0";

    uniqueBoosts.forEach(b => {
        const displayName = BoostDisplayNames[b.type] ?? b.type;

        // Use ascended boost if Dreamling is ascended
        const levelForBoost = ascendedDreamlings.includes(d) ? 333 : d.level;
        const rarityData = rarities[d.rarity];
        const baseValue = rarityData.baseBoost + (rarityData.levelBoost * levelForBoost);

        const line = document.createElement("div");
        line.textContent = `${displayName}: +${baseValue.toFixed(2)}%`;
        boostsDiv.appendChild(line);
    });

    card.appendChild(boostsDiv);

    // TRADED banner
    if (d.isTraded) {
        const banner = document.createElement("div");
        banner.textContent = "TRADED";
        banner.style.position = "absolute";
        banner.style.top = "10px";
        banner.style.left = "-40px";
        banner.style.width = "120px";
        banner.style.backgroundColor = "rgba(255,215,0,0.85)";
        banner.style.color = "#111";
        banner.style.fontWeight = "bold";
        banner.style.fontSize = "0.75em";
        banner.style.textAlign = "center";
        banner.style.transform = "rotate(-45deg)";
        banner.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
        card.appendChild(banner);
    }

    // Event banner
    if (d.isEvent) {
        const banner = document.createElement("div");
        banner.textContent = `${d.eventIdentity}`;
        banner.style.position = "absolute";
        banner.style.top = "10px";
        banner.style.right = "-40px";
        banner.style.width = "120px";
        banner.style.backgroundColor = "rgba(255,0,0,0.8)";
        banner.style.color = "#fff";
        banner.style.fontWeight = "bold";
        banner.style.fontSize = "0.75em";
        banner.style.textAlign = "center";
        banner.style.transform = "rotate(45deg)";
        banner.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
        card.appendChild(banner);
    }

    return card;
}

function renderTrophyHall() {
    const container = document.getElementById("trophy-hall");
    if (!container) return;

    container.innerHTML = "<h2>Trophy Hall</h2>";

    if (!ascendedDreamlings || ascendedDreamlings.length === 0) {
        container.innerHTML += "<p>No Dreamlings ascended yet.</p>";
        return;
    }

    const totalBoosts = {};

    // --- Calculate total boosts first ---
    ascendedDreamlings.forEach(d => {
        const rarityData = rarities[d.rarity];
        if (!rarityData) return;

        const ascendedBoost = rarityData.baseBoost + (rarityData.levelBoost * 333);
        (d.bonusBoosts || []).forEach(b => {
            const key = b.type;
            totalBoosts[key] = (totalBoosts[key] || 0) + ascendedBoost;
        });
    });

    // --- Render Boost Cards ---
    const boostsGrid = document.createElement("div");
    boostsGrid.className = "boosts-grid";
    boostsGrid.style.marginBottom = "20px";

    for (const [key, value] of Object.entries(totalBoosts)) {
        const boostCard = document.createElement("div");
        boostCard.className = "boost-card";

        const title = document.createElement("h4");
        title.textContent = BoostDisplayNames[key] ?? key;

        const val = document.createElement("p");
        val.textContent = `+${value.toFixed(2)}%`;

        boostCard.appendChild(title);
        boostCard.appendChild(val);
        boostsGrid.appendChild(boostCard);
    }

    container.appendChild(boostsGrid);

    // --- Render Dreamling Cards ---
    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fit, minmax(250px, max-content))";
    grid.style.gap = "10px";
    grid.style.padding = "5px";

    ascendedDreamlings.forEach(d => {
        const card = createTrophyHallCard(d);
        grid.appendChild(card);
    });

    container.appendChild(grid);
}

//#endregion

//#region WILD AREAS TAB
function renderWildAreaButtons() {
    const container = document.getElementById("wild-area-buttons");
    if (!container) return console.error("wild-area-buttons not found in DOM");

    container.innerHTML = "";

    const unlocked = getUnlockedAreas();

    unlocked.forEach(area => {
        const btn = document.createElement("button");
        btn.textContent = capitalize(area);
        btn.className = "area-btn move-btn";
        btn.disabled = false;

        // Handle event area separately
        if (area === "event") {
            // Disable button if no active access and no vouchers
            if (!hasEventAccess() && eventVouchers <= 0) {
                btn.disabled = false; // keep it clickable for alert
            }
        }

        btn.addEventListener("click", () => {
            if (area === "event") {
                // Check event access
                if (!hasEventAccess()) {
                    if (eventVouchers > 0) {
                        // Show confirmation dialog before using voucher
                        showConfirm(
                            `Use an Event Voucher to access the Event Area? You have ${eventVouchers} voucher(s) remaining.`,
                            () => {
                                // User confirmed - use voucher and enter event area
                                useEventVoucher();
                                selectedArea = area;
                                highlightSelectedArea(area);
                                renderAvailableDreamlings(area);
                            },
                            () => {
                                console.log("Event voucher use canceled");
                            }
                        );
                        return; // Stop here, wait for user decision
                    } else {
                        showMessage("You don't have event access or a voucher!"); 
                        return; // prevent switching to event area
                    }
                }
            }

            // For non-event areas or event areas with active access
            selectedArea = area;
            highlightSelectedArea(area);
            renderAvailableDreamlings(area);
        });

        container.appendChild(btn);
    });

    // Check if current selected area is still accessible
    if (selectedArea === "event" && !hasEventAccess()) {
        // Kick player out of event area
        showMessage("Your event access has expired! Returning to Forest.");
        selectedArea = "forest";
    }

    // Default to forest if nothing selected or area is invalid
    if (!selectedArea || !unlocked.includes(selectedArea) || 
        (selectedArea === "event" && !hasEventAccess() && eventVouchers <= 0)) {
        selectedArea = "forest";
    }

    highlightSelectedArea(selectedArea);
    renderAvailableDreamlings(selectedArea);
}

function highlightSelectedArea(area) {
  const container = document.getElementById("wild-area-buttons");
  if (!container) return;
  Array.from(container.children).forEach(b => {
    b.classList.toggle("active", b.textContent.toLowerCase() === area);
  });
}

// Add this function to periodically check event access
function checkEventAccess() {
    if (selectedArea === "event" && !hasEventAccess()) {
        // Kick player out of event area
        showMessage("Your event access has expired! Returning to Forest.");
        selectedArea = "forest";
        renderWildAreaButtons(); // Re-render to update UI
    }
}

// Helper: format seconds nicely
function formatTime(seconds) {
  if (isNaN(seconds) || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTimeHours(seconds) {
  if (isNaN(seconds) || seconds <= 0) return "0:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function getUnlockedAreas() {
  return areas.filter(area => playerLevel >= areaUnlockLevels[area]);
}

function renderAvailableDreamlings(area) {
  const container = document.getElementById("available");
  container.innerHTML = "<h3>Available Dreamlings In This Area</h3>";

  const speciesList = speciesByArea[area] || [];

  if (speciesList.length === 0) {
    container.innerHTML += "<p>No Dreamlings available in this area yet.</p>";
    return;
  }

  // Alphabetize and join with commas
  const sorted = [...speciesList].sort((a, b) => a.localeCompare(b));
  container.innerHTML += `<p>${sorted.join(", ")}</p>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("search-btn");

  // Add new wild Dreamling
    searchBtn.addEventListener("click", () => {
        if (!selectedArea) { showMessage("Please select an area first!"); return; }
        if (energy <= 0) { showMessage("Not enough energy!"); return; }
        if (!spendEnergy(1)) return;

        const newWild = generateDreamling(true, selectedArea);
        newWild.disappearTimer = 600 + Math.floor(Math.random() * 300);
        newWild.tamingTimer = newWild.tamingRequired;
        newWild.taming = false;

        wildQueue.push(newWild);

        // Re-render the entire wild queue instead of appending
        renderWildQueue();
    });
});

function useEventVoucher() {
    if (eventVouchers <= 0) return false;

    eventVouchers--;
    eventAccess = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    updateSidebarEventDisplay();
    return true;
}

function hasEventAccess() {
  if (!eventAccess) return false;
  if (Date.now() > eventAccess) {
    eventAccess = null; // expired
    updateSidebarEventDisplay();
    return false;
  }
  return true;
}

function renderWildQueue(filteredQueue = null) {
  if (selectedArea === "event") {
        checkEventAccess();
  }

  const container = document.getElementById("wild-queue");
  if (!container) return console.error("wild-queue container not found in DOM");

  const queue = filteredQueue || wildQueue;
  container.innerHTML = "";

  if (queue.length === 0) {
    container.innerHTML = "<p>No wild Dreamlings.</p>";
    
    // RESET: If queue is empty and we think we're taming, reset the flag
    if (isTamingInProgress) {
      console.warn("Resetting isTamingInProgress - queue empty but flag was true");
      isTamingInProgress = false;
    }
    return;
  }

  container.style.display = "grid";
  container.style.gridTemplateColumns = "repeat(auto-fill, minmax(180px, 1fr))";
  container.style.gap = "10px";

  // Check if any Dreamling is actually taming
  const anyTaming = queue.some(d => d.taming);
  if (!anyTaming && isTamingInProgress) {
    console.warn("Resetting isTamingInProgress - no Dreamlings are taming but flag was true");
    isTamingInProgress = false;
  }

  queue.forEach((d, index) => {
    // Calculate current progress
    const progressPercent = d.taming ? 1 - d.tamingTimer / d.tamingRequired : 0;

    const card = document.createElement("div");
    card.className = "dreamling-card";
    card.style.backgroundColor = "#636363ff";
    card.style.color = "#111";
    card.style.borderRadius = "10px";
    card.style.border = `2px solid ${rarities[d.rarity].displayColor}`;
    card.style.overflow = "hidden";
    card.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";
    card.style.position = "relative";
    card.style.paddingBottom = "10px";

    card.innerHTML = `
        <div style="
            background-color: ${rarities[d.rarity].displayColor};
            color: #111;
            font-weight: bold;
            text-align: center;
            padding: 4px 0;
            font-size: 0.9em;
            border-radius: 6px 6px 0 0;
        ">
            ${d.isStar ? "⭐ " : ""}${capitalize(d.rarity)} ${d.rank}
        </div>

        <div style="text-align:center; margin:8px 0; font-weight:bold;">${d.species}</div>

        <div style="
            background:#ccc;
            width:90%;
            height:8px;
            border-radius:4px;
            overflow:hidden;
            margin:4px auto;
        ">
            <div id="taming-bar-${index}" style="
            background: linear-gradient(to right, #4caf50, #8bc34a);
            width:${(progressPercent * 100).toFixed(2)}%;
            height:100%;
            transition: width 0.5s;
            "></div>
        </div>

        <div style="font-size:0.85em; text-align:center; margin-top:4px;">
            Taming Time: <span id="taming-${index}">${formatTime(d.tamingTimer)}</span><br>
            Disappears In: <span id="disappear-${index}">${formatTime(d.disappearTimer)}</span>
        </div>

        <button class="move-btn" id="tame-${index}" style="
            display:block;
            margin:6px auto 0 auto;
            padding:4px 10px;
            border-radius:6px;
            ${(isTamingInProgress && !d.taming) ? 'opacity:0.5; cursor:not-allowed;' : ''}
        ">
            ${d.taming ? "Taming..." : "Tame"}
        </button>
        `;

    if (d.isEvent) {
      const banner = document.createElement("div");
      banner.textContent = `${d.eventIdentity}`;
      banner.style.position = "absolute";
      banner.style.top = "10px";
      banner.style.right = "-40px";
      banner.style.width = "120px";
      banner.style.backgroundColor = "rgba(255,0,0,0.8)";
      banner.style.color = "#fff";
      banner.style.fontWeight = "bold";
      banner.style.fontSize = "0.75em";
      banner.style.textAlign = "center";
      banner.style.transform = "rotate(45deg)";
      banner.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
      card.appendChild(banner);
    }

    // NEW! banner if not in dreamBook
    const bookKey = d.isEvent && d.eventIdentity ? `${d.species} (${d.eventIdentity})` : d.species;
    const entry = dreamBook[bookKey]?.[d.rarity]?.[d.rank];

    if (!entry || !entry.collected) {
        const newBanner = document.createElement("div");
        newBanner.textContent = "NEW!";
        newBanner.style.position = "absolute";
        newBanner.style.top = "5px";
        newBanner.style.left = "5px";
        newBanner.style.backgroundColor = "green";
        newBanner.style.color = "#fff";
        newBanner.style.fontWeight = "bold";
        newBanner.style.fontSize = "0.7em";
        newBanner.style.padding = "2px 4px";
        newBanner.style.borderRadius = "4px";
        newBanner.style.boxShadow = "0 1px 2px rgba(0,0,0,0.3)";
        card.appendChild(newBanner);
    }

    const tameBtn = card.querySelector(`#tame-${index}`);
    
    // Only add click handler if not disabled
    if (!isTamingInProgress || d.taming) {
      tameBtn.addEventListener("click", () => {
        if (isTamingInProgress && !d.taming) {
          showMessage("You can only tame one Dreamling at a time!");
          return;
        }

        if (!d.taming) {
          d.taming = true;
          d.tamingTimer = d.tamingRequired;
          isTamingInProgress = true;
          tameBtn.textContent = "Taming...";
          tameBtn.style.opacity = "0.5";
          tameBtn.style.cursor = "not-allowed";
          renderWildQueue();
        }
      });
    } else {
      tameBtn.disabled = true;
      tameBtn.style.opacity = "0.5";
      tameBtn.style.cursor = "not-allowed";
    }

    container.appendChild(card);
  });
}

function cleanupDreamling(dreamling) {
  if (!dreamling.isWild) {
    delete dreamling.tamingElapsed;
    delete dreamling.tamingProgress;
    delete dreamling.tamingRequired;
    delete dreamling.critChance;
    delete dreamling.disappearEndTime;
    delete dreamling.tamingCompleteTime;
  }
  
  return dreamling;
}

// When tamed successfully
function tameDreamling(w) {  
  // Remove from wild queue first
  wildQueue = wildQueue.filter(x => x.id !== w.id);
  
  // Reset the global flag
  isTamingInProgress = false;

  showMessage(`${w.species} was tamed!`);

  // Try to add to party first, otherwise storage
  if (partyDreamlings.length < maxPartySize) {
    w.isWild = false;
    w.location = "party";
    cleanupDreamling(w);
    partyDreamlings.push(w);
  } else if (storageDreamlings.length < maxStorageSize) {
    w.isWild = false;
    w.location = "storage";
    cleanupDreamling(w);
    storageDreamlings.push(w);
  } else {
    showMessage("No room! Dreamling released.");
  }

  logDreamlingToBook(w);
  updateQuestProgress("tame", { rarity: w.rarity });
  saveGame();
  renderAllSections();
  renderWildQueue();
}

function startWildQueueLoop() {
  wildQueue.forEach((d, index) => {
    // Only update UI
    if (d.taming) {
      const bar = document.getElementById(`taming-bar-${index}`);
      if (bar) bar.style.width = `${100 * (1 - d.tamingTimer / d.tamingRequired)}%`;

      const tamingText = document.getElementById(`taming-${index}`);
      if (tamingText) tamingText.textContent = formatTime(d.tamingTimer);
    } else {
      const disappearText = document.getElementById(`disappear-${index}`);
      if (disappearText) disappearText.textContent = formatTime(d.disappearTimer);
    }
  });
}

// Update the display
function updateEnergyDisplay() {
  const display = document.getElementById("energy-count");
  if (!display) return;

  let nextIn = 0;
  if (energy < maxEnergy && nextEnergyTimestamp) {
    nextIn = Math.max(0, Math.ceil((nextEnergyTimestamp - Date.now()) / 1000));
  }

  display.textContent = `Energy: ${energy} / ${maxEnergy}` +
    (energy < maxEnergy ? ` (Next in ${formatTime(nextIn)})` : "");
}

// Initialize the energy timer on page load
function initEnergy() {
  if (energy < maxEnergy && !nextEnergyTimestamp) {
    nextEnergyTimestamp = Date.now() + ENERGY_REGEN_INTERVAL;
  }
  updateEnergyDisplay();
}

function regenEnergyLoop() {
    const now = Date.now();

    // Get current boosts
    const boosts = calculateBoosts();
    const energyRegenMultiplier = boosts.energyRegen || 1;

    // Adjust interval based on energyRegen boost
    let adjustedInterval = ENERGY_REGEN_INTERVAL / energyRegenMultiplier;

    // Ensure interval is never below 1 minute (60000 ms)
    adjustedInterval = Math.max(adjustedInterval, 60000);

    if (energy < maxEnergy) {
        if (!nextEnergyTimestamp) nextEnergyTimestamp = now + adjustedInterval;

        while (now >= nextEnergyTimestamp && energy < maxEnergy) {
            energy += 1;
            nextEnergyTimestamp += adjustedInterval;
        }

        if (energy >= maxEnergy) {
            energy = maxEnergy;
            nextEnergyTimestamp = null;
        }

        updateEnergyDisplay();
    }
}

// Call this when spending energy
function spendEnergy(amount = 1) {
  if (energy < amount) return false;
  energy -= amount;

  // Start regen timer if not already running
  if (!nextEnergyTimestamp) nextEnergyTimestamp = Date.now() + ENERGY_REGEN_INTERVAL;

  updateEnergyDisplay();
  return true;
}

//#endregion

//#region DREAMBOOK TAB
// Called when a Dreamling is tamed, fused, or traded
function logDreamlingToBook(d) {
  const { species, rarity, rank, isStar, isEvent, eventIdentity } = d;

  // Use same key as renderSpeciesGrid
  const bookKey = eventIdentity ? `${species} (${eventIdentity})` : species;

  if (!dreamBook[bookKey]) dreamBook[bookKey] = {};
  if (!dreamBook[bookKey][rarity]) dreamBook[bookKey][rarity] = {};
  if (!dreamBook[bookKey][rarity][rank]) {
    dreamBook[bookKey][rarity][rank] = {
      collected: false,
      firstCollectedDate: null,
      isStar: false,
      price: getPrice(species, rarity, rank, !!eventIdentity),
      isEvent: !!isEvent,
      eventIdentity: eventIdentity || null
    };
  }

  const entry = dreamBook[bookKey][rarity][rank];

  // Always update star status if this Dreamling is a star
  if (isStar && !entry.isStar) {
    entry.isStar = true;
  }

  // Only mark as collected and timestamp if it’s new
  if (!entry.collected) {
    entry.collected = true;
    entry.firstCollectedDate = Date.now();
    updateQuestProgress("register");
  }

  saveGame();
}

function getPrice(species, rarity, tier, isEvent = false) {
    // Base price for Common T1
    const basePrice = 100_000;

    // Rarity multiplier
    const rarityMultiplier = {
        common: 1,
        uncommon: 2,
        rare: 5,
        epic: 10,
        legendary: 25
    }[rarity] || 1;

    // Tier multiplier
    const tierMultiplier = { T1: 1, T2: 1.2, T3: 1.5, T4: 2, T5: 2.5 }[tier] || 1;

    // Event multiplier
    const eventMultiplier = isEvent ? 3 : 1;

    return Math.floor(basePrice * rarityMultiplier * tierMultiplier * eventMultiplier);
}

// Unlock logic
function isUnlocked(species, rarity, rank, eventIdentity = null) {
  const bookKey = eventIdentity ? `${species} (${eventIdentity})` : species;
  const entry = dreamBook[bookKey]?.[rarity]?.[rank];
  const unlocked = entry && entry.collected;
  return unlocked;
}

// -------------------- ALL SPECIES --------------------
function getAllSpecies() {
  const regular = [...speciesPool].sort((a, b) => a.localeCompare(b));

  const eventList = [];
  for (const monthYear in seasonalSpecies) {
    seasonalSpecies[monthYear].forEach(sp => {
      eventList.push({ name: sp, eventIdentity: monthYear });
    });
  }

  return { regular, eventList };
}

// -------------------- LETTER TABS --------------------
// Generate A-Z tabs
function renderLetterTabs() {
  const lettersContainer = document.getElementById("dreambook-letters");
  lettersContainer.innerHTML = "";
  for (let i = 65; i <= 90; i++) { // ASCII A-Z
    const letter = String.fromCharCode(i);
    const btn = document.createElement("button");
    btn.textContent = letter;
    btn.className = "move-btn";
    // Highlight if currently selected
    if (letter === selectedLetter) btn.classList.add("active");
    
    btn.addEventListener("click", () => {
      selectedLetter = letter;
      renderLetterTabs();                  // re-render to update highlight
      renderSpeciesList(letter, document.getElementById("dreambook-search").value);
    });
    lettersContainer.appendChild(btn);
  }
}

// Render species list based on letter filter + search filter
function renderSpeciesList(letterFilter = null, searchFilter = "") {
  const container = document.getElementById("dreambook-species");
  container.innerHTML = "";

  const allSpecies = [...speciesPool]; // regular species
  const seasonalKeys = Object.keys(seasonalSpecies);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Flatten seasonal species into array of {name, eventIdentity} and filter for past/current
  const eventSpeciesList = [];
  seasonalKeys.forEach(monthYear => {
    const [monthStr, yearStr] = monthYear.split("-");
    let month = parseInt(monthStr, 10);
    let year = parseInt(yearStr, 10);
    if (year < 100) year += 2000;

    // Only include events that are past or current month/year
    if (year < currentYear || (year === currentYear && month <= currentMonth)) {
      seasonalSpecies[monthYear].forEach(name => {
        // Use the original hyphen format directly
        eventSpeciesList.push({ name, eventIdentity: monthYear });
      });
    }
  });

  // Remove duplicates from regular species that are event species
  const eventNames = eventSpeciesList.map(e => e.name);
  const uniqueRegular = [...new Set(allSpecies.filter(s => !eventNames.includes(s)))];

  // Combine filtered lists
  let filteredRegular = [...uniqueRegular];
  let filteredEvent = [...eventSpeciesList];

  // Apply letter filter
  if (letterFilter) {
    filteredRegular = filteredRegular.filter(s => s[0].toUpperCase() === letterFilter);
    filteredEvent = filteredEvent.filter(e => e.name[0].toUpperCase() === letterFilter);
  }

  // Apply search filter
  if (searchFilter) {
    const q = searchFilter.toLowerCase();
    filteredRegular = filteredRegular.filter(s => s.toLowerCase().includes(q));
    filteredEvent = filteredEvent.filter(e => e.name.toLowerCase().includes(q));
  }

  // Sort alphabetically
  filteredRegular.sort((a, b) => a.localeCompare(b));
  filteredEvent.sort((a, b) => a.name.localeCompare(b.name));

  // Render regular species
  filteredRegular.forEach(species => {
    const btn = document.createElement("button");
    btn.textContent = species;
    btn.className = "move-btn";
    btn.style.marginBottom = "5px";
    btn.addEventListener("click", () => {
      renderSpeciesGrid(species);

      if (currentSelectedButton) currentSelectedButton.classList.remove("selected-species");
      btn.classList.add("selected-species");
      currentSelectedButton = btn;
    });
    container.appendChild(btn);
  });

  // Render event species
  filteredEvent.forEach(({ name, eventIdentity }) => {
    const btn = document.createElement("button");
    btn.textContent = `${name} (${eventIdentity})`; // This will now show "Moonspell (10-25)"
    btn.className = "move-btn";
    btn.style.backgroundColor = "rgba(255,100,100,0.3)";
    btn.style.marginBottom = "5px";
    btn.addEventListener("click", () => {
      renderSpeciesGrid(name, eventIdentity); // This passes "10-25" to renderSpeciesGrid

      if (currentSelectedButton) currentSelectedButton.classList.remove("selected-species");
      btn.classList.add("selected-species");
      currentSelectedButton = btn;
    });
    container.appendChild(btn);
  });
}

function renderSpeciesGrid(species, eventIdentity = null) {
    const gridContainer = document.getElementById("dreambook-grid");
    const bookKey = eventIdentity ? `${species} (${eventIdentity})` : species;

    gridContainer.innerHTML = `<h3>${species}${eventIdentity ? ` (${eventIdentity})` : ""}</h3>`;

    const raritiesKeys = Object.keys(rarities);
    const ranks = ["T1", "T2", "T3", "T4", "T5"];

    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(200px, 1fr))";
    grid.style.gap = "10px";

    raritiesKeys.forEach(rarity => {
        ranks.forEach(rank => {
            // Get the entry from dreamBook using bookKey
            const entry = dreamBook[bookKey]?.[rarity]?.[rank];
            const isUnlocked = entry && entry.collected;

            const card = document.createElement("div");
            card.className = "dream-book-card";
            card.style.border = `2px solid ${isUnlocked ? rarities[rarity].displayColor : "#888"}`;
            card.style.borderRadius = "10px";
            card.style.padding = "5px";
            card.style.background = "#636363ff";
            card.style.position = "relative";
            card.style.textAlign = "center";
            card.style.minHeight = "100px";
            card.style.display = "flex";
            card.style.overflow = "hidden";
            card.style.flexDirection = "column";
            card.style.justifyContent = "space-between";

            // Rarity + rank banner
            const banner = document.createElement("div");
            banner.textContent = `${capitalize(rarity)} ${rank}`;
            banner.style.backgroundColor = rarities[rarity].displayColor;
            banner.style.color = "#111";
            banner.style.fontWeight = "bold";
            banner.style.padding = "2px 0";
            banner.style.borderRadius = "6px 6px 0 0";
            card.appendChild(banner);

            // Info section
            const info = document.createElement("div");
            info.style.marginTop = "5px";
            info.style.minHeight = "30px";

            if (!isUnlocked) {
                info.textContent = "Locked";
                info.style.opacity = 0.5;
                card.appendChild(info);
            } else {
                info.innerHTML = `Collected<br>${
                    entry.firstCollectedDate
                        ? new Date(entry.firstCollectedDate).toLocaleDateString()
                        : ""
                }`;
                card.appendChild(info);

                const buyBtn = document.createElement("button");
                buyBtn.textContent = `Buy for ${formatPrice(entry.price)}`;
                buyBtn.className = "move-btn";
                buyBtn.style.marginTop = "5px";
                buyBtn.onclick = () => buyDreamBookEntry(species, rarity, rank, eventIdentity);
                card.appendChild(buyBtn);
            }

            // Event banner - check if this should be an event dreamling
            const shouldShowEventBanner = (entry?.isEvent && entry?.eventIdentity) || 
                                        (isUnlocked && eventIdentity);
            if (shouldShowEventBanner) {
                const eventBanner = document.createElement("div");
                eventBanner.textContent = entry?.eventIdentity || eventIdentity;
                eventBanner.style.position = "absolute";
                eventBanner.style.top = "10px";
                eventBanner.style.right = "-40px";
                eventBanner.style.width = "120px";
                eventBanner.style.backgroundColor = "rgba(255,0,0,0.8)";
                eventBanner.style.color = "#fff";
                eventBanner.style.fontWeight = "bold";
                eventBanner.style.fontSize = "0.75em";
                eventBanner.style.textAlign = "center";
                eventBanner.style.transform = "rotate(45deg)";
                eventBanner.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
                card.appendChild(eventBanner);
            }

            grid.appendChild(card);
        });
    });

    gridContainer.appendChild(grid);
}

function buyDreamBookEntry(species, rarity, rank, eventIdentity = null) {
  const bookKey = eventIdentity ? `${species} (${eventIdentity})` : species;
  const entry = dreamBook[bookKey]?.[rarity]?.[rank];
  
  if (!entry || !entry.price) {
    console.error(`Entry not found for: ${bookKey}, ${rarity}, ${rank}`);
    showMessage("Error: Dream Book entry not found!");
    return;
  }

  const totalDreamlings = partyDreamlings.length + storageDreamlings.length;
  const totalCapacity = maxPartySize + maxStorageSize;

  if (totalDreamlings >= totalCapacity) {
    showMessage("No room to store this Dreamling! Free up space first.");
    return;
  }

  if (dreamPoints < entry.price) {
    showMessage("Not enough Dream Points!");
    return;
  }

  dreamPoints -= entry.price;

  // --- Generate the Dreamling ---
  const rarityData = rarities[rarity];
  const bonusCount = getBonusCountForRank(rank);
  const bonusBoosts = getRandomBonusTypes(bonusCount);

  // Calculate star chance
  const starChance = calculateStarChance();
  const isStar = Math.random() < starChance;

  const now = new Date();
  const monthKey = `${now.getMonth() + 1}-${now.getFullYear().toString().slice(-2)}`;
  
  // Use the provided eventIdentity if available, otherwise determine from current month
  const isEvent = !!eventIdentity || seasonalSpecies[monthKey]?.includes(species);
  const finalEventIdentity = eventIdentity || (isEvent ? monthKey : null);

  const dreamling = {
    id: generateUniqueId(),
    species,
    rarity,
    rank,
    isStar: isStar,
    level: 1,
    xp: 0,
    location: "storage",
    baseBoost: rarityData.baseBoost,
    bonusBoosts,
    maxLevel: isStar ? rarityData.maxLevel * 2 : rarityData.maxLevel,
    isWild: false,
    isEvent,
    eventIdentity: finalEventIdentity,
    isTraded: false,
    pendingTrade: false,
    tradingExpiresAt: null
  };

  logDreamlingToBook(dreamling);

  // --- Add to storage (or party if space) ---
  if (partyDreamlings.length < maxPartySize) {
    dreamling.location = "party";
    partyDreamlings.push(dreamling);
  } else {
    storageDreamlings.push(dreamling);
  }

  // --- UI updates ---
  // Re-render using the same parameters
  renderSpeciesGrid(species, eventIdentity);
  updateDreamPointsDisplay();
  renderAllSections();
  updatePlayerInfo();
  
  const starText = isStar ? " ⭐ STAR" : "";
  const eventText = isEvent ? " (Event)" : "";
  showMessage(`${capitalize(species)} (${rarity} ${rank})${starText}${eventText} added to your collection!`);
  
  saveGame();
}

// Export Dream Book to CSV
function exportDreamBookToCSV() {
  const rarities = ["common", "uncommon", "rare", "epic", "legendary"];
  const ranks = ["T1", "T2", "T3", "T4", "T5"];
  
  // Build header row
  const headers = ["Species", "Location/Event"];
  
  // Rarity abbreviations
  const rarityAbbrev = {
    common: "C",
    uncommon: "UC",
    rare: "R",
    epic: "E",
    legendary: "L"
  };
  
  // Add all rarity/rank combinations with abbreviated headers
  for (const rarity of rarities) {
    for (const rank of ranks) {
      const rankNum = rank.substring(1); // "T1" → "1"
      headers.push(`${rarityAbbrev[rarity]}${rankNum}`);
    }
  }
  
  const rows = [headers];
  
  // Get all species (regular + event)
  const { regular, eventList } = getAllSpecies();
  
  // Process regular species
  for (const species of regular) {
    const row = processSpeciesRow(species, null);
    rows.push(row);
  }
  
  // Process event species - only current or past, sorted by event then alphabetically
  const filteredEvents = eventList.filter(eventData => 
    isEventCurrentOrPast(eventData.eventIdentity)
  );
  
  // Sort by event identity first, then by species name
  filteredEvents.sort((a, b) => {
    // Compare event identity first
    if (a.eventIdentity !== b.eventIdentity) {
      return a.eventIdentity.localeCompare(b.eventIdentity);
    }
    // If same event, sort by name
    return a.name.localeCompare(b.name);
  });
  
  for (const eventData of filteredEvents) {
    const row = processSpeciesRow(eventData.name, eventData.eventIdentity);
    rows.push(row);
  }
  
  // Convert to CSV string
  const csvContent = rows.map(row => 
    row.map(cell => {
      // Escape quotes and wrap in quotes if contains comma
      if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(',')
  ).join('\n');
  
  // Download the file
  downloadCSV(csvContent, 'dreambook_export.csv');
  
  showMessage("Dream Book exported to CSV!");
}

function isEventCurrentOrPast(eventIdentity) {
  if (!eventIdentity) return false;

  const [monthStr, yearStr] = eventIdentity.split("-"); // "10-25" → ["10", "25"]
  const eventMonth = parseInt(monthStr, 10);
  const eventYear = 2000 + parseInt(yearStr, 10); // assumes YY = 20YY

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Check if event year is before current year
  if (eventYear < currentYear) return true;
  
  // If same year, check if month is current or past
  if (eventYear === currentYear && eventMonth <= currentMonth) return true;
  
  // Otherwise it's in the future
  return false;
}

function processSpeciesRow(species, eventIdentity) {
  const rarities = ["common", "uncommon", "rare", "epic", "legendary"];
  const ranks = ["T1", "T2", "T3", "T4", "T5"];
  
  const bookKey = eventIdentity ? `${species} (${eventIdentity})` : species;
  
  // Start with species name and location
  const row = [species];
  
  // Add location/event column
  if (eventIdentity) {
    row.push(eventIdentity);
  } else {
    // Find which area this species belongs to
    const area = findSpeciesArea(species);
    row.push(area || "Unknown");
  }
  
  // Add all rarity/rank combinations
  for (const rarity of rarities) {
    for (const rank of ranks) {
      const entry = dreamBook[bookKey]?.[rarity]?.[rank];
      
      if (entry && entry.collected) {
        // Collected - check if star
        if (entry.isStar) {
          row.push("s");
        } else {
          row.push("x");
        }
      } else {
        // Not collected - empty cell
        row.push("");
      }
    }
  }
  
  return row;
}

function findSpeciesArea(species) {
  // Check speciesByArea object
  if (typeof speciesByArea !== 'undefined') {
    for (const [areaName, speciesList] of Object.entries(speciesByArea)) {
      if (speciesList && speciesList.includes(species)) {
        return capitalize(areaName);
      }
    }
  }
  
  return "Unknown";
}

function downloadCSV(csvContent, filename) {
  // Create a Blob from the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a temporary link element
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}

// Initialize Dream Book
document.addEventListener("DOMContentLoaded", () => {
  const dreamBookTab = document.querySelector('[data-tab="dreambook"]');
  if (dreamBookTab) {
    dreamBookTab.addEventListener("click", () => {
      setTimeout(() => {
        addExportButtonToDreamBook();
      }, 100);
    });
  }

  renderLetterTabs();         // render A-Z buttons with highlight
  renderSpeciesList("A");     // show letter A by default
  document.getElementById("dreambook-search").addEventListener("input", (e) => {
    renderSpeciesList(null, e.target.value);
  });
});
//#endregion

//#region FUSION TAB
function canFuse(d1, d2) {
    if (!d1 || !d2) return false;

    // Prevent fusing tired Dreamlings
    const now = Date.now();
    if ((d1.tiredUntil && now < d1.tiredUntil) || (d2.tiredUntil && now < d2.tiredUntil)) {
        showMessage("One or both Dreamlings are tired and need to rest before fusing again.");
        return false;
    }

    // Level, rarity, and rank requirements
    if (d1.level < 25 || d2.level < 25) return false;
    if (d1.rarity !== d2.rarity || d1.rank !== d2.rank) return false;

    return true;
}

function getSuccessRate(rarity) {
    return fusionChances[rarity] ?? 0;
}

function fuseDreamlings(d1, d2) {
    if (!canFuse(d1, d2)) {
        showMessage("Fusion failed: level, rarity, or rank mismatch.");
        return null;
    }

    const successChance = getSuccessRate(d1.rarity);
    const success = Math.random() <= successChance / 100;

    // Mark parents as tired
    d1.tiredUntil = Date.now() + 30 * 60 * 1000;
    d2.tiredUntil = Date.now() + 30 * 60 * 1000;

    if (!success) {
        showMessage("Fusion failed! Dreamlings are tired.");

        // Clear fusion slots
        fusionSlot1 = null;
        fusionSlot2 = null;

        if (typeof fusionSlots !== "undefined") {
            fusionSlots[0] = null;
            fusionSlots[1] = null;
        }
        updateFusionSlots();
        renderFusionStorage();
        return null;
    }
    
    // Generate base Dreamling using standard generator
    let result = generateDreamling();

    // Override with fusion-specific properties
    result.species = Math.random() < 0.5 ? d1.species : d2.species;
    result.rarity = d1.rarity;
    result.rank = d1.rank;
    result.level = 1;
    result.xp = 0;

    // --- Call handleProgression before setting bonuses ---
    handleProgression(d1, d2, result);

    // Generate bonuses based on final rank
    const bonusCount = getBonusCountForRank(result.rank);
    result.bonusBoosts = getRandomBonusTypes(bonusCount);

    // Recalculate max level from rarity
    const rarityData = rarities[result.rarity];
    result.maxLevel = result.isStar ? rarityData.maxLevel * 2 : rarityData.maxLevel;

    // Handle seasonal/event species
    const now = new Date();
    const monthKey = `${now.getMonth()+1}-${now.getFullYear().toString().slice(-2)}`;
    const seasonalList = seasonalSpecies[monthKey] || [];
    if (seasonalList.includes(result.species)) {
        result.isEvent = true;
        result.eventIdentity = monthKey;
    } else {
        result.isEvent = false;
        result.eventIdentity = null;
    }

    // Reset taming & other default properties
    result.location = "storage";
    result.isWild = false;
    result.isTraded = false;
    result.pendingTrade = false;
    result.tradingExpiresAt = null;

    // CHECK IF NEW BEFORE logging to book
    const bookKey = result.isEvent && result.eventIdentity 
        ? `${result.species} (${result.eventIdentity})` 
        : result.species;
    const entry = dreamBook[bookKey]?.[result.rarity]?.[result.rank];
    const isNew = !entry || !entry.collected;
    
    if (isNew) {
        result._isNewFusion = true;
    }

    // Remove parents from storage
    storageDreamlings = storageDreamlings.filter(d => d !== d1 && d !== d2);

    // Add new Dreamling to storage
    storageDreamlings.push(result);
    
    // Log to book AFTER we've checked if it's new
    logDreamlingToBook(result);
    updateQuestProgress("fuse");

    // Render the resulting Dreamling in the middle slot
    renderFusionSlot(result, "result-slot");

    // Refresh storage display
    renderFusionStorage();

    return result;
}

function handleProgression(d1, d2, result) {
    const nextRarity = {
        common: "uncommon",
        uncommon: "rare",
        rare: "epic",
        epic: "legendary",
        legendary: "legendary"
    };

    const rankNum = parseInt(d1.rank.slice(1));
    const nextRank = "T" + Math.min(rankNum + 1, 5);

    // Special handling for legendary fusions - always rank up
    if (d1.rarity.toLowerCase() === "legendary") {
        result.rarity = "legendary";
        result.rank = nextRank;
    } 
    // If already at T5, can only upgrade rarity
    else if (d1.rank === "T5") {
        result.rarity = nextRarity[d1.rarity.toLowerCase()] ?? d1.rarity;
        result.rank = "T5";
    }
    else {
        const roll = Math.random();
        if (roll < 0.33) {
            // Rank up only
            result.rarity = d1.rarity;
            result.rank = nextRank;
        } else if (roll < 0.66) {
            // Rarity up only
            result.rarity = nextRarity[d1.rarity.toLowerCase()] ?? d1.rarity;
            result.rank = d1.rank;
        } else {
            // Both rarity and rank up
            result.rarity = nextRarity[d1.rarity.toLowerCase()] ?? d1.rarity;
            result.rank = nextRank;
        }
    }

    // Star logic
    if (d1.rarity.toLowerCase() === "legendary" && d1.rank === "T5") {
        result.isStar = true;
    } else if (d1.isStar && d2.isStar) {
        result.isStar = true;
    } else if (d1.isStar || d2.isStar) {
        result.isStar = Math.random() < 0.5;
    }
}

function selectFusionSlot(dreamling) {
    const selectedIndex = fusionSlots.findIndex(slot => slot === dreamling);

    if (selectedIndex !== -1) {
        // Deselect
        fusionSlots[selectedIndex] = null;
        document.getElementById(`fusion-slot-${selectedIndex + 1}`).innerHTML = "";
    } else {
        // Confirm if it's a star Dreamling
        const proceed = () => {
            const emptyIndex = fusionSlots.findIndex(slot => slot === null);
            if (emptyIndex === -1) {
                showMessage("Both fusion slots are already filled.");
                return;
            }
            fusionSlots[emptyIndex] = dreamling;
            renderFusionSlot(dreamling, `fusion-slot-${emptyIndex + 1}`);
            renderFusionStorage();
        };

        if (dreamling.isStar) {
            showConfirm(
                "⚠️ This is a ⭐ Dreamling! Are you sure you want to use it for fusion?",
                proceed,
                () => { /* Do nothing on cancel */ }
            );
        } else {
            proceed();
        }
    }
}

function renderFusionCards(array, containerId, onClick = null) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  // Filter only level 25+ Dreamlings
  const eligibleDreamlings = array.filter(d => d.level >= 25);

  container.style.display = "grid";
  container.style.gridTemplateColumns = "repeat(auto-fill, minmax(250px, 1fr))";
  container.style.gap = "10px";

  eligibleDreamlings.forEach(d => {
    const card = document.createElement("div");
    card.className = "dreamling-card";
    card.style.backgroundColor = fusionSlots.includes(d) ? "#fff3b0" : "#636363ff";
    card.style.border = fusionSlots.includes(d)
      ? "3px solid #FFD700"
      : `2px solid ${rarities[d.rarity].displayColor}`;
    card.style.color = "#111";
    card.style.borderRadius = "10px";
    card.style.overflow = "hidden";
    card.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";
    card.style.position = "relative";
    card.style.paddingBottom = "10px";
    card.style.cursor = "pointer";

    // --- header ---
    const header = document.createElement("div");
    header.style.backgroundColor = rarities[d.rarity].displayColor;
    header.style.color = "#111";
    header.style.fontWeight = "bold";
    header.style.textAlign = "center";
    header.style.padding = "4px 0";
    header.style.fontSize = "0.9em";
    header.textContent = `${d.isStar ? "⭐ " : ""}${capitalize(d.rarity)} ${d.rank}`;
    card.appendChild(header);

    // --- species ---
    const speciesDiv = document.createElement("div");
    speciesDiv.style.textAlign = "center";
    speciesDiv.style.margin = "8px 0";
    speciesDiv.style.fontWeight = "bold";
    speciesDiv.textContent = d.species;
    card.appendChild(speciesDiv);

    // --- level + XP ---
    const { currentXP, maxXP } = getLevelXP(d);
    const levelDiv = document.createElement("div");
    levelDiv.textContent = `Level ${d.level} (${Math.floor(currentXP)} / ${Math.floor(maxXP)})`;
    card.appendChild(levelDiv);

    const xpBar = document.createElement("div");
    xpBar.style.background = "#ccc";
    xpBar.style.width = "90%";
    xpBar.style.height = "8px";
    xpBar.style.borderRadius = "4px";
    xpBar.style.overflow = "hidden";
    xpBar.style.margin = "3px auto";

    const xpFill = document.createElement("div");
    xpFill.style.background = "linear-gradient(to right, #4caf50, #8bc34a)";
    const fillPercent = d.level === d.maxLevel ? 100 : Math.min((currentXP / maxXP) * 100, 100);
    xpFill.style.width = `${fillPercent}%`;
    xpFill.style.height = "100%";
    xpFill.style.transition = "width 0.5s";

    xpBar.appendChild(xpFill);
    card.appendChild(xpBar);

    // --- boosts ---
    const uniqueBoosts = [...new Map(d.bonusBoosts.map(b => [b.type, b])).values()];

    const boostsHTML = uniqueBoosts
      .map(b => {
        const displayName = BoostDisplayNames[b.type] ?? b.type;
        const baseValue = getDreamlingBoost(d); // ✅ consistent capped calculation
        const finalValue = b.value ? baseValue * b.value : baseValue; // multiply or use base
        return `<div>${displayName}: +${finalValue.toFixed(2)}%</div>`;
      })
      .join("");

    const boostsDiv = document.createElement("div");
    boostsDiv.style.margin = "5px 0";
    boostsDiv.innerHTML = boostsHTML;
    card.appendChild(boostsDiv);

    // --- tired state ---
    if (d.tiredUntil && d.tiredUntil > Date.now()) {
      const tiredOverlay = document.createElement("div");
      tiredOverlay.style.position = "absolute";
      tiredOverlay.style.top = "0";
      tiredOverlay.style.left = "0";
      tiredOverlay.style.width = "100%";
      tiredOverlay.style.height = "100%";
      tiredOverlay.style.backgroundColor = "rgba(0,0,0,0.6)";
      tiredOverlay.style.display = "flex";
      tiredOverlay.style.flexDirection = "column";
      tiredOverlay.style.justifyContent = "center";
      tiredOverlay.style.alignItems = "center";
      tiredOverlay.style.color = "white";
      tiredOverlay.style.fontWeight = "bold";
      tiredOverlay.style.fontSize = "1.1em";
      tiredOverlay.style.zIndex = "5";

      const zzz = document.createElement("div");
      zzz.textContent = "💤";
      zzz.style.fontSize = "1.8em";
      tiredOverlay.appendChild(zzz);

      const timer = document.createElement("div");
      tiredOverlay.appendChild(timer);

      const updateTimer = () => {
        const remaining = d.tiredUntil - Date.now();
        if (remaining <= 0) {
          tiredOverlay.remove();
          renderFusionStorage();
          return;
        }
        const mins = Math.floor((remaining / 1000 / 60) % 60);
        const secs = Math.floor((remaining / 1000) % 60);
        timer.textContent = `${mins}:${secs.toString().padStart(2, "0")}`;
      };

      updateTimer();
      const interval = setInterval(() => {
        const remaining = d.tiredUntil - Date.now();
        if (remaining <= 0) {
          clearInterval(interval);
          tiredOverlay.remove();
          renderFusionStorage();
        } else {
          updateTimer();
        }
      }, 1000);

      card.appendChild(tiredOverlay);
    }

    // --- event banner ---
    if (d.isEvent) {
      const banner = document.createElement("div");
      banner.textContent = `${d.eventIdentity}`;
      banner.style.position = "absolute";
      banner.style.top = "10px";
      banner.style.right = "-40px";
      banner.style.width = "120px";
      banner.style.backgroundColor = "rgba(255,0,0,0.8)";
      banner.style.color = "#fff";
      banner.style.fontWeight = "bold";
      banner.style.fontSize = "0.75em";
      banner.style.textAlign = "center";
      banner.style.transform = "rotate(45deg)";
      banner.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
      card.appendChild(banner);
    }

    // TRADED banner
    if (d.isTraded) {
        const banner = document.createElement("div");
        banner.textContent = "TRADED";
        banner.style.position = "absolute";
        banner.style.top = "10px";
        banner.style.left = "-40px";
        banner.style.width = "120px";
        banner.style.backgroundColor = "rgba(255,215,0,0.85)";
        banner.style.color = "#111";
        banner.style.fontWeight = "bold";
        banner.style.fontSize = "0.75em";
        banner.style.textAlign = "center";
        banner.style.transform = "rotate(-45deg)";
        banner.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
        card.appendChild(banner);
    }

    // --- click behavior ---
    if (onClick) {
      card.addEventListener("click", () => onClick(d));
    }

    container.appendChild(card);
  });
}

function renderFusionSlot(dreamling, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    if (!dreamling) {
        container.textContent = containerId === "result-slot" ? "Result Slot" : `Slot ${containerId.slice(-1)}`;
        container.classList.remove("selected");
        return;
    }

    container.classList.add("selected");

    const card = document.createElement("div");
    card.className = "dreamling-card";
    card.style.width = "250px";
    card.style.minWidth = "250px";
    card.style.backgroundColor = "#636363ff";
    card.style.color = "#111";
    card.style.borderRadius = "10px";
    card.style.border = `2px solid ${rarities[dreamling.rarity].displayColor}`;
    card.style.overflow = "hidden";
    card.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";
    card.style.position = "relative";
    card.style.paddingBottom = "10px";

    const header = document.createElement("div");
    header.style.backgroundColor = rarities[dreamling.rarity].displayColor;
    header.style.color = "#111";
    header.style.fontWeight = "bold";
    header.style.textAlign = "center";
    header.style.padding = "4px 0";
    header.style.fontSize = "0.9em";
    header.textContent = `${dreamling.isStar ? "⭐ " : ""}${capitalize(dreamling.rarity)} ${dreamling.rank}`;
    card.appendChild(header);

    const speciesDiv = document.createElement("div");
    speciesDiv.style.textAlign = "center";
    speciesDiv.style.margin = "8px 0";
    speciesDiv.style.fontWeight = "bold";
    speciesDiv.textContent = dreamling.species;
    card.appendChild(speciesDiv);

    const { currentXP, maxXP } = getLevelXP(dreamling);
    const levelDiv = document.createElement("div");
    levelDiv.textContent = `Level ${dreamling.level} (${Math.floor(currentXP)} / ${Math.floor(maxXP)})`;
    card.appendChild(levelDiv);

    const xpBar = document.createElement("div");
    xpBar.style.background = "#ccc";
    xpBar.style.width = "90%";
    xpBar.style.height = "8px";
    xpBar.style.borderRadius = "4px";
    xpBar.style.overflow = "hidden";
    xpBar.style.margin = "3px auto";

    const xpFill = document.createElement("div");
    xpFill.style.background = "linear-gradient(to right, #4caf50, #8bc34a)";
    const fillPercent = dreamling.level === dreamling.maxLevel ? 100 : Math.min((currentXP / maxXP) * 100, 100);
    xpFill.style.width = `${fillPercent}%`;
    xpFill.style.height = "100%";
    xpFill.style.transition = "width 0.5s";

    xpBar.appendChild(xpFill);
    card.appendChild(xpBar);

    const uniqueBoosts = [...new Map(dreamling.bonusBoosts.map(b => [b.type, b])).values()];

    const boostsHTML = uniqueBoosts
      .map(b => {
        const displayName = BoostDisplayNames[b.type] ?? b.type;
        const baseValue = getDreamlingBoost(dreamling);
        const percentValue = b.value ? baseValue * b.value : baseValue;

        return `<div>${displayName}: +${percentValue.toFixed(2)}%</div>`;
      })
      .join("");

    const boostsDiv = document.createElement("div");
    boostsDiv.style.margin = "5px 0";
    boostsDiv.innerHTML = boostsHTML;
    card.appendChild(boostsDiv);

    // Event banner (if applicable)
    if (dreamling.isEvent) {
        const banner = document.createElement("div");
        banner.textContent = dreamling.eventIdentity;
        banner.style.position = "absolute";
        banner.style.top = "10px";
        banner.style.right = "-40px";
        banner.style.width = "120px";
        banner.style.backgroundColor = "rgba(255,0,0,0.8)";
        banner.style.color = "#fff";
        banner.style.fontWeight = "bold";
        banner.style.fontSize = "0.75em";
        banner.style.textAlign = "center";
        banner.style.transform = "rotate(45deg)";
        banner.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
        card.appendChild(banner);
    }

    // NEW! banner - check if this was marked as new
    // Use the _isNewFusion flag that we'll set in fuseDreamlings
    if (dreamling._isNewFusion) {
        const newBanner = document.createElement("div");
        newBanner.textContent = "NEW!";
        newBanner.style.position = "absolute";
        newBanner.style.top = "5px";
        newBanner.style.left = "5px";
        newBanner.style.backgroundColor = "green";
        newBanner.style.color = "#fff";
        newBanner.style.fontWeight = "bold";
        newBanner.style.fontSize = "0.7em";
        newBanner.style.padding = "2px 4px";
        newBanner.style.borderRadius = "4px";
        newBanner.style.boxShadow = "0 1px 2px rgba(0,0,0,0.3)";
        newBanner.style.zIndex = "10";
        card.appendChild(newBanner);
    }

    container.appendChild(card);
}

function updateFusionFilterButtons() {
    const fusionWrapper = document.getElementById("fusion-storage")?.parentElement;
    const buttonsWrapper = fusionWrapper?.querySelector(".filter-buttons");
    if (!buttonsWrapper) return;

    // Rarity buttons
    const rarityButtons = buttonsWrapper.querySelectorAll('[data-filter-type="rarity"]');
    rarityButtons.forEach(btn => {
        const btnRarity = btn.dataset.rarity;
        if (btnRarity === "all" && fusionFilterState.rarity === null) {
            btn.style.fontWeight = "bold";
            btn.style.opacity = "1";
            btn.style.backgroundColor = "#4caf50";
        } else if (btnRarity !== "all" && btnRarity === fusionFilterState.rarity) {
            btn.style.fontWeight = "bold";
            btn.style.opacity = "1";
            btn.style.backgroundColor = "#4caf50";
        } else {
            btn.style.fontWeight = "normal";
            btn.style.opacity = "0.6";
            btn.style.backgroundColor = "";
        }
    });

    // Update star filter button
    const starBtn = buttonsWrapper.querySelector('[data-filter-type="star"]');
    if (starBtn) {
        const state = fusionFilterState.star;
        if (state === 'only') {
            starBtn.textContent = "Stars ONLY";
            starBtn.style.fontWeight = "bold";
            starBtn.style.backgroundColor = "#ffd700";
            starBtn.style.color = "#111";
        } else if (state === 'exclude') {
            starBtn.textContent = "Stars OFF";
            starBtn.style.fontWeight = "bold";
            starBtn.style.backgroundColor = "#666";
            starBtn.style.color = "#fff";
        } else {
            starBtn.textContent = "Stars";
            starBtn.style.fontWeight = "normal";
            starBtn.style.backgroundColor = "";
            starBtn.style.color = "";
        }
    }

    // Update event filter button
    const eventBtn = buttonsWrapper.querySelector('[data-filter-type="event"]');
    if (eventBtn) {
        const state = fusionFilterState.event;
        if (state === 'only') {
            eventBtn.textContent = "Events ONLY";
            eventBtn.style.fontWeight = "bold";
            eventBtn.style.backgroundColor = "#ff6b6b";
            eventBtn.style.color = "#fff";
        } else if (state === 'exclude') {
            eventBtn.textContent = "Events OFF";
            eventBtn.style.fontWeight = "bold";
            eventBtn.style.backgroundColor = "#666";
            eventBtn.style.color = "#fff";
        } else {
            eventBtn.textContent = "Events";
            eventBtn.style.fontWeight = "normal";
            eventBtn.style.backgroundColor = "";
            eventBtn.style.color = "";
        }
    }

    // Update traded filter button
    const tradedBtn = buttonsWrapper.querySelector('[data-filter-type="traded"]');
    if (tradedBtn) {
        const state = fusionFilterState.traded;
        if (state === 'only') {
            tradedBtn.textContent = "Traded ONLY";
            tradedBtn.style.fontWeight = "bold";
            tradedBtn.style.backgroundColor = "#ffa500";
            tradedBtn.style.color = "#fff";
        } else if (state === 'exclude') {
            tradedBtn.textContent = "Traded OFF";
            tradedBtn.style.fontWeight = "bold";
            tradedBtn.style.backgroundColor = "#666";
            tradedBtn.style.color = "#fff";
        } else {
            tradedBtn.textContent = "Traded";
            tradedBtn.style.fontWeight = "normal";
            tradedBtn.style.backgroundColor = "";
            tradedBtn.style.color = "";
        }
    }

    // Update sort buttons
    const sortButtons = buttonsWrapper.querySelectorAll('.sort-btn');
    sortButtons.forEach(btn => {
        const isActive = fusionSortState === btn.dataset.sortType;
        if (isActive) {
            btn.style.fontWeight = "bold";
            btn.style.backgroundColor = "#2196f3";
            btn.style.color = "#fff";
        } else {
            btn.style.fontWeight = "normal";
            btn.style.backgroundColor = "";
            btn.style.color = "";
        }
    });
}

function renderFusionStorage() {
    const container = document.getElementById("fusion-storage");

    let eligibleDreamlings = storageDreamlings.filter(d => d.level >= 25);

    // Apply rarity filter
    if (fusionFilterState.rarity) {
        eligibleDreamlings = eligibleDreamlings.filter(d => d.rarity === fusionFilterState.rarity);
    }

    // Apply star filter (3-state)
    if (fusionFilterState.star === 'only') {
        eligibleDreamlings = eligibleDreamlings.filter(d => d.isStar === true);
    } else if (fusionFilterState.star === 'exclude') {
        eligibleDreamlings = eligibleDreamlings.filter(d => !d.isStar);
    }

    // Apply event filter (3-state)
    if (fusionFilterState.event === 'only') {
        eligibleDreamlings = eligibleDreamlings.filter(d => d.isEvent === true);
    } else if (fusionFilterState.event === 'exclude') {
        eligibleDreamlings = eligibleDreamlings.filter(d => !d.isEvent);
    }

    // Apply traded filter (3-state)
    if (fusionFilterState.traded === 'only') {
        eligibleDreamlings = eligibleDreamlings.filter(d => d.isTraded === true);
    } else if (fusionFilterState.traded === 'exclude') {
        eligibleDreamlings = eligibleDreamlings.filter(d => !d.isTraded);
    }

    // Apply sorting
    eligibleDreamlings = sortDreamlings(eligibleDreamlings, fusionSortState);

    const fusionWrapper = container.parentElement;
    const header = fusionWrapper.querySelector("h3");

    // --- Filter Buttons ---
    let buttonsWrapper = fusionWrapper.querySelector(".filter-buttons");
    if (!buttonsWrapper) {
        buttonsWrapper = document.createElement("div");
        buttonsWrapper.className = "filter-buttons";
        buttonsWrapper.style.display = "flex";
        buttonsWrapper.style.gap = "6px";
        buttonsWrapper.style.margin = "6px 0";
        buttonsWrapper.style.flexWrap = "wrap";
        header?.insertAdjacentElement("afterend", buttonsWrapper);

        // Rarity label
        const rarityLabel = document.createElement("span");
        rarityLabel.textContent = "Rarity:";
        rarityLabel.style.fontWeight = "bold";
        rarityLabel.style.alignSelf = "center";
        rarityLabel.style.marginRight = "4px";
        buttonsWrapper.appendChild(rarityLabel);

        // "All" button
        const allBtn = document.createElement("button");
        allBtn.className = "move-btn filter-btn";
        allBtn.textContent = "All";
        allBtn.dataset.filterType = "rarity";
        allBtn.dataset.rarity = "all"; 
        allBtn.addEventListener("click", () => {
            fusionFilterState.rarity = null;
            updateFusionFilterButtons();
            renderFusionStorage();
        });
        buttonsWrapper.appendChild(allBtn);

        // Rarity filter buttons
        const rarityKeys = ["common", "uncommon", "rare", "epic", "legendary"];
        rarityKeys.forEach(rarity => {
            const btn = document.createElement("button");
            btn.className = "move-btn filter-btn";
            btn.textContent = capitalize(rarity);
            btn.dataset.rarity = rarity;
            btn.dataset.filterType = "rarity";
            
            btn.addEventListener("click", () => {
                fusionFilterState.rarity = rarity;
                updateFusionFilterButtons();
                renderFusionStorage();
            });

            buttonsWrapper.appendChild(btn);
        });

        // Spacer
        const spacer1 = document.createElement("div");
        spacer1.style.width = "100%";
        spacer1.style.height = "4px";
        buttonsWrapper.appendChild(spacer1);

        // Special filters label
        const specialLabel = document.createElement("span");
        specialLabel.textContent = "Filters:";
        specialLabel.style.fontWeight = "bold";
        specialLabel.style.alignSelf = "center";
        specialLabel.style.marginRight = "4px";
        buttonsWrapper.appendChild(specialLabel);

        // Star filter button (3-state)
        const starBtn = document.createElement("button");
        starBtn.className = "move-btn filter-btn";
        starBtn.textContent = "Stars";
        starBtn.dataset.filterType = "star";
        starBtn.addEventListener("click", () => {
            const current = fusionFilterState.star;
            if (current === 'all') fusionFilterState.star = 'only';
            else if (current === 'only') fusionFilterState.star = 'exclude';
            else fusionFilterState.star = 'all';
            updateFusionFilterButtons();
            renderFusionStorage();
        });
        buttonsWrapper.appendChild(starBtn);

        // Event filter button (3-state)
        const eventBtn = document.createElement("button");
        eventBtn.className = "move-btn filter-btn";
        eventBtn.textContent = "Events";
        eventBtn.dataset.filterType = "event";
        eventBtn.addEventListener("click", () => {
            const current = fusionFilterState.event;
            if (current === 'all') fusionFilterState.event = 'only';
            else if (current === 'only') fusionFilterState.event = 'exclude';
            else fusionFilterState.event = 'all';
            updateFusionFilterButtons();
            renderFusionStorage();
        });
        buttonsWrapper.appendChild(eventBtn);

        // Traded filter button (3-state)
        const tradedBtn = document.createElement("button");
        tradedBtn.className = "move-btn filter-btn";
        tradedBtn.textContent = "Traded";
        tradedBtn.dataset.filterType = "traded";
        tradedBtn.addEventListener("click", () => {
            const current = fusionFilterState.traded;
            if (current === 'all') fusionFilterState.traded = 'only';
            else if (current === 'only') fusionFilterState.traded = 'exclude';
            else fusionFilterState.traded = 'all';
            updateFusionFilterButtons();
            renderFusionStorage();
        });
        buttonsWrapper.appendChild(tradedBtn);

        // Spacer
        const spacer2 = document.createElement("div");
        spacer2.style.width = "100%";
        spacer2.style.height = "4px";
        buttonsWrapper.appendChild(spacer2);

        // Sort label
        const sortLabel = document.createElement("span");
        sortLabel.textContent = "Sort by:";
        sortLabel.style.fontWeight = "bold";
        sortLabel.style.alignSelf = "center";
        sortLabel.style.marginRight = "4px";
        buttonsWrapper.appendChild(sortLabel);

        // Sort buttons
        const sortOptions = [
            { value: 'species', label: 'Species' },
            { value: 'rarity', label: 'Rarity' },
            { value: 'rank', label: 'Rank' },
            { value: 'level', label: 'Level' }
        ];

        sortOptions.forEach(option => {
            const btn = document.createElement("button");
            btn.className = "move-btn sort-btn";
            btn.textContent = option.label;
            btn.dataset.sortType = option.value;
            btn.addEventListener("click", () => {
                fusionSortState = option.value;
                updateFusionFilterButtons();
                renderFusionStorage();
            });
            buttonsWrapper.appendChild(btn);
        });
    }

    // Update button styles
    updateFusionFilterButtons();

    // --- Render cards ---
    renderFusionCards(eligibleDreamlings, "fusion-storage", selectFusionSlot);
}

function updateFusionSlots() {
    const slot1El = document.getElementById("fusion-slot-1");
    const slot2El = document.getElementById("fusion-slot-2");

    slot1El.textContent = fusionSlot1 ? `${fusionSlot1.species}\nLv ${fusionSlot1.level}` : "Slot 1";
    slot2El.textContent = fusionSlot2 ? `${fusionSlot2.species}\nLv ${fusionSlot2.level}` : "Slot 2";

    slot1El.classList.toggle("selected", !!fusionSlot1);
    slot2El.classList.toggle("selected", !!fusionSlot2);
}

document.getElementById("fusion-button").addEventListener("click", () => {
    const [slot1, slot2] = fusionSlots;

    if (!slot1 || !slot2) {
        showMessage("Select two Dreamlings to fuse!");
        return;
    }

    const result = fuseDreamlings(slot1, slot2);
    
    fusionSlots = [null, null];

    renderFusionSlot(fusionSlots[0], "fusion-slot-1");
    renderFusionSlot(fusionSlots[1], "fusion-slot-2");

    renderFusionStorage();

    if (result) {
        renderFusionSlot(result, "result-slot");
    }
});

function renderFusionSlotResult(dreamling) {
    const container = document.getElementById("result-slot");
    container.innerHTML = "";
    if (!dreamling) return;

    const card = document.createElement("div");
    card.className = "dreamling-card";
    card.style.backgroundColor = "#636363ff";
    card.style.color = "#111";
    card.style.borderRadius = "10px";
    card.style.border = `2px solid ${rarities[dreamling.rarity].displayColor}`;
    card.style.overflow = "hidden";
    card.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";
    card.style.position = "relative";
    card.style.paddingBottom = "10px";

    const header = document.createElement("div");
    header.style.backgroundColor = rarities[dreamling.rarity].displayColor;
    header.style.color = "#111";
    header.style.fontWeight = "bold";
    header.style.textAlign = "center";
    header.style.padding = "4px 0";
    header.style.fontSize = "0.9em";
    header.textContent = `${dreamling.isStar ? "⭐ " : ""}${capitalize(dreamling.rarity)} ${dreamling.rank}`;
    card.appendChild(header);

    const speciesDiv = document.createElement("div");
    speciesDiv.style.textAlign = "center";
    speciesDiv.style.margin = "8px 0";
    speciesDiv.style.fontWeight = "bold";
    speciesDiv.textContent = dreamling.species;
    card.appendChild(speciesDiv);

    const { currentXP, maxXP } = getLevelXP(dreamling);
    const levelDiv = document.createElement("div");
    levelDiv.textContent = `Level ${dreamling.level} (${Math.floor(currentXP)} / ${Math.floor(maxXP)})`;
    card.appendChild(levelDiv);

    const xpBar = document.createElement("div");
    xpBar.style.background = "#ccc";
    xpBar.style.width = "90%";
    xpBar.style.height = "8px";
    xpBar.style.borderRadius = "4px";
    xpBar.style.overflow = "hidden";
    xpBar.style.margin = "3px auto";

    const xpFill = document.createElement("div");
    xpFill.style.background = "linear-gradient(to right, #4caf50, #8bc34a)";
    const fillPercent = dreamling.level === dreamling.maxLevel ? 100 : Math.min((currentXP / maxXP) * 100, 100);
    xpFill.style.width = `${fillPercent}%`;
    xpFill.style.height = "100%";
    xpFill.style.transition = "width 0.5s";

    xpBar.appendChild(xpFill);
    card.appendChild(xpBar);

    const uniqueBoosts = [...new Map(dreamling.bonusBoosts.map(b => [b.type, b])).values()];
    const boostsHTML = uniqueBoosts
      .map(b => {
        const displayName = BoostDisplayNames[b.type] ?? b.type;

        // ✅ Use consistent boost logic
        const baseValue = getDreamlingBoost(dreamling);
        const percentValue = b.value ? baseValue * b.value : baseValue;

        return `<div>${displayName}: +${percentValue.toFixed(2)}%</div>`;
      })
      .join("");

    const boostsDiv = document.createElement("div");
    boostsDiv.style.margin = "5px 0";
    boostsDiv.innerHTML = boostsHTML;
    card.appendChild(boostsDiv);

    if (dreamling.isEvent) {
        const banner = document.createElement("div");
        banner.textContent = dreamling.eventIdentity;
        banner.style.position = "absolute";
        banner.style.top = "10px";
        banner.style.right = "-40px";
        banner.style.width = "120px";
        banner.style.backgroundColor = "rgba(255,0,0,0.8)";
        banner.style.color = "#fff";
        banner.style.fontWeight = "bold";
        banner.style.fontSize = "0.75em";
        banner.style.textAlign = "center";
        banner.style.transform = "rotate(45deg)";
        banner.style.boxShadow = "0 2px 4px rgba(0,0,0,0.3)";
        card.appendChild(banner);
    }

    container.appendChild(card);
}
//#endregion

//#region RANCH TAB
function refundRanchInvestment() {
    // Only give refund if player actually had ranch data
    if (ranch && ranch.rooms) {
        console.log("Player had ranch data - giving refund...");
        
        let totalRefundResearch = 1500000; // 1.5M research
        let totalRefundGold = 750000;      // 500K gold

        // Optional: Calculate bonus based on furniture levels
        let totalFurnitureLevels = 0;
        for (const [roomName, room] of Object.entries(ranch.rooms)) {
            if (room.furniture) {
                for (const [furnitureName, furniture] of Object.entries(room.furniture)) {
                    if (furniture.level > 0) {
                        totalFurnitureLevels += furniture.level;
                    }
                }
            }
        }

        if (totalFurnitureLevels > 0) {
            const bonusResearch = totalFurnitureLevels * 50000;
            const bonusGold = totalFurnitureLevels * 25000;
            totalRefundResearch += bonusResearch;
            totalRefundGold += bonusGold;
            console.log(`Added bonus for ${totalFurnitureLevels} furniture levels`);
        }

        // Give the refund - SET the values directly
        researchPoints += totalRefundResearch;
        gold += totalRefundGold;

        // Show refund message
        showMessage(`🎁 Ranch System Update! You received a refund of ${formatPrice(totalRefundResearch)} RP and ${formatPrice(totalRefundGold)} Gold! 
          Use these with the new system!`)

        console.log(`Refund given: ${totalRefundResearch} RP, ${totalRefundGold} Gold`);

        // Clear the ranch data since we're not using it anymore
        ranch = null;
        saveGame();

        return true; // Refund was given
    }

    console.log("No ranch data found - no refund needed");
    return false; // No refund given
}

// Calculate the cost for the next level of a boost
function getBoostUpgradeCost(boostType) {
    const currentLevel = boostLevels[boostType];
    const baseCost = {
        gold: 5000,
        researchPoints: 10000
    };
    
    // Cost increases by 1.5x per level
    const multiplier = Math.pow(1.5, currentLevel);
    
    return {
        gold: Math.floor(baseCost.gold * multiplier),
        researchPoints: Math.floor(baseCost.researchPoints * multiplier)
    };
}

// Get the current total value of a boost
function getBoostTotalValue(boostType) {
    // Add safety check
    if (!boostBaseValues || !boostBaseValues[boostType]) {
        console.warn(`Boost base value not found for: ${boostType}`);
        return 0;
    }
    
    const level = boostLevels[boostType] || 0;
    const baseValue = boostBaseValues[boostType];
    return level * baseValue;
}

// Upgrade a specific boost
function upgradeBoost(boostType) {
    const cost = getBoostUpgradeCost(boostType);
    
    // Check if player can afford it
    if (!canAfford(cost)) {
        showMessage("Not enough resources!");
        return;
    }
    
    // Deduct cost
    deductCost(cost);
    
    // Increase level
    boostLevels[boostType]++;
    
    // Apply the new boost values
    applyBoostUpgrades();
    
    // Update UI
    renderBoostUpgrades();
    renderAllSections();
    updatePlayerInfo();
    updateGoldDisplay();
    updateResearchPointsDisplay();
    updateDreamPointsDisplay();
    
    showMessage(`${BoostDisplayNames[boostType]} upgraded to level ${boostLevels[boostType]}!`);
    updateQuestProgress("upgrade");
}

function applyBoostUpgrades() { 
    // Reset to base values first, THEN add boosts
    const baseChests = 30;
    const basePartySize = 10;
    const baseTrainingSize = 5;
    const baseEnergy = 30;
    const baseQuestRepeats = 5;
    const baseStorage = isGnomeHome ? 5000 : 500;
    
    // Apply boosts to base values
    maxChests = baseChests + getBoostTotalValue('maxChests');
    maxPartySize = basePartySize + getBoostTotalValue('maxParty');
    maxTrainingSize = baseTrainingSize + getBoostTotalValue('maxTraining');
    maxEnergy = baseEnergy + getBoostTotalValue('maxEnergy');
    maxQuestRepeats = baseQuestRepeats + getBoostTotalValue('maxQuests');
    maxStorageSize = baseStorage + getBoostTotalValue('maxStorage');
}

// Initialize the boost upgrade system
function initializeBoostUpgrades() {
    applyBoostUpgrades();
}

function renderBoostUpgrades() {
    const container = document.getElementById("ranch");
    if (!container) return;
    
    container.innerHTML = "";
    
    // Main card
    const mainCard = document.createElement("div");
    mainCard.className = "ranch-card";
    mainCard.style.padding = "20px";
    
    // Header
    const header = document.createElement("h2");
    header.textContent = "Boost Upgrades";
    header.style.marginBottom = "20px";
    header.style.textAlign = "center";
    mainCard.appendChild(header);
    
    // Categories
    const categories = {
        "Resource Gain": ["xp", "dreamPoints", "researchPoints", "gold"],
        "Gameplay": ["star", "critChance", "taming", "energyRegen", "chestRegen"],
        "Capacity": ["maxEnergy", "maxChests", "maxParty", "maxTraining", "maxStorage", "maxQuests"]
    };
    
    for (const [categoryName, boostTypes] of Object.entries(categories)) {
        // Category header
        const categoryHeader = document.createElement("h3");
        categoryHeader.textContent = categoryName;
        categoryHeader.style.marginTop = "25px";
        categoryHeader.style.marginBottom = "15px";
        categoryHeader.style.color = "#ffffffff";
        categoryHeader.style.textAlign = "center";
        mainCard.appendChild(categoryHeader);
        
        // Grid for boosts in this category
        const grid = document.createElement("div");
        grid.className = "boosts-grid";
        
        for (const boostType of boostTypes) {
            const card = createBoostCard(boostType);
            grid.appendChild(card);
        }
        
        mainCard.appendChild(grid);
    }
    
    container.appendChild(mainCard);
}

function createBoostCard(boostType) {
    const card = document.createElement("div");
    card.className = "boost-card";
    
    // Title
    const title = document.createElement("h4");
    title.textContent = BoostDisplayNames[boostType];
    card.appendChild(title);
    
    // Current level
    const level = document.createElement("p");
    level.textContent = `Level: ${boostLevels[boostType]}`;
    level.style.fontWeight = "bold";
    card.appendChild(level);
    
    // Current bonus
    const currentBonus = getBoostTotalValue(boostType);
    const isPercent = !boostType.includes("max");
    const bonus = document.createElement("p");
    bonus.textContent = `Bonus: +${isPercent ? (currentBonus * 100).toFixed(2) + '%' : currentBonus}`;
    bonus.style.color = "#cccccc";
    card.appendChild(bonus);
    
    // Next level bonus
    const nextBonus = currentBonus + boostBaseValues[boostType];
    const nextLevel = document.createElement("p");
    nextLevel.textContent = `Next: +${isPercent ? (nextBonus * 100).toFixed(2) + '%' : nextBonus}`;
    nextLevel.style.fontSize = "0.85em";
    nextLevel.style.color = "#aaaaaa";
    card.appendChild(nextLevel);
    
    // Cost
    const cost = getBoostUpgradeCost(boostType);
    const costDiv = document.createElement("div");
    costDiv.innerHTML = `<strong>Cost:</strong><br>
        Gold: ${formatPrice(cost.gold)}<br>
        Research: ${formatPrice(cost.researchPoints)}`;
    costDiv.style.fontSize = "0.85em";
    costDiv.style.marginTop = "8px";
    costDiv.style.marginBottom = "8px";
    card.appendChild(costDiv);
    
    // Upgrade button
    const button = document.createElement("button");
    button.className = "move-btn";
    button.textContent = "Upgrade";
    button.style.marginTop = "5px";
    button.style.width = "100%";
    
    const canAffordUpgrade = canAfford(cost);
    button.disabled = !canAffordUpgrade;
    
    if (!canAffordUpgrade) {
        button.style.opacity = "0.5";
        button.style.cursor = "not-allowed";
    }
    
    button.addEventListener("click", () => upgradeBoost(boostType));
    card.appendChild(button);
    
    return card;
}

function canAfford(cost) {
    if (cost.gold !== undefined && gold < cost.gold) return false;
    if (cost.researchPoints !== undefined && researchPoints < cost.researchPoints) return false;
    return true;
}

function deductCost(cost) {
    if (cost.gold !== undefined) gold -= cost.gold;
    if (cost.researchPoints !== undefined) researchPoints -= cost.researchPoints;
}

function formatPrice(value) {
    if (value >= 1000000) return (value / 1000000).toFixed(2) + "M";
    if (value >= 1000) return (value / 1000).toFixed(1) + "K";
    return value.toString();
}

//#endregion

//#region COLLECTION TAB
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getSeededRarity(id) {
  const rarities = ["common", "uncommon", "rare", "epic", "legendary"];
  const roll = seededRandom(globalSeed + id) * 100;

  if (roll < 50) return "common";
  if (roll < 75) return "uncommon";
  if (roll < 90) return "rare";
  if (roll < 98) return "epic";
  return "legendary";
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getCollectibleById(id) {
  const rarity = getSeededRarity(id);
  const isEvent = id > 5000;
  const perSecondValue = collectibleValues[rarity];
  
  return {
    id,
    baseNumber: id,
    rarity,
    event: isEvent,
    perSecondValue,
  };
}

function getAllCollectibles() {
  const items = [];

  // Base collectibles (1-5000)
  for (let i = 1; i <= 5000; i++) {
    items.push(getCollectibleById(i));
  }

  // Event collectibles (deterministic by month)
  const startDate = new Date(startYear, startMonth);
  const now = new Date();
  const monthsSinceStart = Math.max(0, 
    (now.getFullYear() - startDate.getFullYear()) * 12 +
    (now.getMonth() - startDate.getMonth())
  );

  const totalMonthlyEvents = monthlyEventCount * (monthsSinceStart + 1);

  for (let i = 1; i <= totalMonthlyEvents; i++) {
    items.push(getCollectibleById(5000 + i));
  }

  return items;
}

function migrateCollectibleIds(data) {  
  // Handle old format where collectibles were full objects
  if (data.playerCollectibles && data.playerCollectibles.length > 0) {
    const firstEntry = data.playerCollectibles[0];
    
    // Check if this is old format (has collectible object)
    if (firstEntry.collectible && typeof firstEntry.collectible === 'object') {
      console.log("Old format detected - migrating...");
      playerCollectibles = data.playerCollectibles.map(entry => ({
        id: Number(entry.collectible.id || entry.collectible.baseNumber), // Ensure it's a number
        count: entry.count || 1
      }));
    } else if (firstEntry.id !== undefined && firstEntry.count !== undefined) {
      // Already new format (just id and count) - but ensure IDs are numbers
      console.log("New format detected - loading directly");
      playerCollectibles = data.playerCollectibles.map(entry => ({
        id: Number(entry.id), // Convert to number just in case
        count: entry.count
      }));
    } else {
      console.warn("Unknown format, attempting to parse:", firstEntry);
      playerCollectibles = [];
    }
  } else if (data.playerCollectibles) {
    console.log("Empty playerCollectibles array");
    playerCollectibles = [];
  } else {
    console.log("No playerCollectibles in save data");
    playerCollectibles = [];
  }
  
  // Clean up old collectibles array if it exists
  if (data.collectibles) {
    console.log("Removing old collectibles array from save data");
    delete data.collectibles;
  }
}

// Get how many of a specific collectible the player owns
function getPlayerCollectibleCount(id) {
  if (!Array.isArray(playerCollectibles)) {
    console.warn("playerCollectibles is not an array!");
    return 0;
  }
  
  const entry = playerCollectibles.find(pc => pc.id === id);
  
  // Debug logging (remove after fixing)
  if (id === 664 && !entry) {
    console.log("Looking for ID 664...");
    console.log("playerCollectibles length:", playerCollectibles.length);
    console.log("First few entries:", playerCollectibles.slice(0, 5));
    console.log("Does 664 exist?", playerCollectibles.find(pc => pc.id == 664)); // loose equality
  }
  
  return entry ? entry.count : 0;
}

function renderCollectibleCard(collectibleObj) {
  const owned = getPlayerCollectibleCount(collectibleObj.id);
  const isLocked = owned === 0;

  const card = document.createElement("div");
  card.className = "collectible-card";
  card.style.position = "relative";
  card.style.borderRadius = "12px";
  card.style.overflow = "hidden";
  card.style.padding = "12px";
  card.style.marginBottom = "8px";
  card.style.textAlign = "center";
  card.style.cursor = "default";
  card.style.backgroundColor = "#1a1a1a";
  card.style.boxShadow = "0 2px 6px rgba(0,0,0,0.4)";
  card.style.transition = "transform 0.2s, box-shadow 0.2s";

  // Set color based on rarity (assuming rarities object exists elsewhere)
  if (typeof rarities !== 'undefined' && rarities[collectibleObj.rarity]) {
    card.style.color = rarities[collectibleObj.rarity].displayColor;
  }

  // Hover effect for owned collectibles
  if (!isLocked) {
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-2px)";
      card.style.boxShadow = "0 4px 12px rgba(0,0,0,0.6)";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0)";
      card.style.boxShadow = "0 2px 6px rgba(0,0,0,0.4)";
    });
  }

  // Card content
  card.innerHTML = `
    <div style="font-weight: bold; font-size: 0.95em; margin-bottom: 4px;">#${collectibleObj.baseNumber}</div>
    <div style="font-size: 0.9em; margin-bottom: 4px;">${capitalize(collectibleObj.rarity)}</div>
    <div style="font-size: 0.85em; margin-bottom: 4px;">Gold/sec: ${collectibleObj.perSecondValue}</div>
    <div style="font-size: 0.85em; font-weight: bold;">Owned: ${owned}</div>
  `;

  // Locked overlay for unowned collectibles
  if (isLocked) {
    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.fontSize = "1.5em";
    overlay.style.color = "#ccc";
    overlay.style.pointerEvents = "none";
    overlay.innerHTML = "🔒";

    card.appendChild(overlay);
    card.style.color = "#888";
  }

  return card;
}

function renderCollectibleGroupButtons() {
  const btnContainer = document.getElementById("collectible-group-buttons");
  if (!btnContainer) return;

  btnContainer.innerHTML = "";

  const groupSize = 500;
  const allCollectibles = getAllCollectibles();

  // Base collectibles buttons
  const baseCollectibles = allCollectibles.filter(c => !c.event);
  const totalBaseGroups = Math.ceil(baseCollectibles.length / groupSize);

  for (let groupIndex = 0; groupIndex < totalBaseGroups; groupIndex++) {
    const start = groupIndex * groupSize;
    const end = Math.min(start + groupSize, baseCollectibles.length);

    const btn = document.createElement("button");
    btn.className = "move-btn";
    btn.textContent = `Base (${start + 1}-${end})`;
    btn.style.margin = "5px";

    btn.addEventListener("click", () => {
      renderCollectibleGroup(baseCollectibles.slice(start, end));
    });

    btnContainer.appendChild(btn);
  }

  // Event collectibles buttons (grouped by month)
  const eventCollectibles = allCollectibles.filter(c => c.event);
  const eventsByMonth = {};
  
  eventCollectibles.forEach(c => {
    const monthIndex = Math.floor((c.id - 5000 - 1) / monthlyEventCount);
    const d = new Date(startYear, startMonth + monthIndex, 1);
    const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
    if (!eventsByMonth[key]) eventsByMonth[key] = [];
    eventsByMonth[key].push(c);
  });

  Object.keys(eventsByMonth).forEach(monthKey => {
    const btn = document.createElement("button");
    btn.className = "move-btn";
    btn.textContent = `Event ${monthKey}`;
    btn.style.margin = "4px";

    btn.addEventListener("click", () => {
      renderCollectibleGroup(eventsByMonth[monthKey]);
    });

    btnContainer.appendChild(btn);
  });
}

// Accepts either a single collectible or an array
function renderCollectiblesGrid(collectiblesToShow) {
  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(150px, 1fr))";
  grid.style.gap = "10px";
  grid.style.padding = "6px";

  collectiblesToShow.forEach(c => {
    const card = renderCollectibleCard(c);
    grid.appendChild(card);
  });

  return grid;
}

// --- Render a group of collectibles for collection tab buttons ---
function renderCollectibleGroup(input, groupSize = 500) {
  const container = document.getElementById("collectible-cards");
  if (!container) return;

  container.innerHTML = "";

  let group;

  if (Array.isArray(input)) {
    group = input;
  } else if (typeof input === "number") {
    const allCollectibles = getAllCollectibles();
    group = allCollectibles.slice(input, input + groupSize);
  } else {
    console.error("Invalid input to renderCollectibleGroup:", input);
    return;
  }

  const cardsGrid = renderCollectiblesGrid(group);
  container.appendChild(cardsGrid);
}

function renderChestButtons() {
  const container = document.getElementById("chest-buttons");
  if (!container) return;

  container.innerHTML = "";

  // Assuming chests and rarities exist elsewhere in your code
  if (typeof rarities === 'undefined' || typeof chests === 'undefined') return;

  Object.keys(rarities).forEach(rarity => {
    const count = chests.filter(c => c.rarity === rarity && !c.opened).length;
    const btn = document.createElement("button");
    btn.textContent = `${capitalize(rarity)} (${count})`;

    btn.style.margin = "4px";
    btn.style.padding = "6px 12px";
    btn.style.border = "1px solid #666";
    btn.style.borderRadius = "6px";
    btn.style.background = "#222";
    btn.style.color = "#f5f5dc";
    btn.style.cursor = "pointer";
    btn.style.fontWeight = "500";
    btn.style.transition = "background 0.2s ease";

    btn.addEventListener("mouseenter", () => {
      btn.style.background = "#444";
    });
    btn.addEventListener("mouseleave", () => {
      btn.style.background = "#222";
    });

    btn.addEventListener("click", () => {
      const results = openRarityChest(rarity);
      renderChestResults(results);
      renderChestButtons();
    });

    container.appendChild(btn);
  });
}

function renderChestResults(results) {
  const container = document.getElementById("chest-result");
  if (!container) return;

  container.innerHTML = "";

  if (!results || results.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: #888; font-style: italic; padding: 20px;">
      No chests opened. Make sure you have unopened chests of this rarity!
    </div>`;
    return;
  }

  // Add a clear summary header
  const summary = document.createElement("div");
  summary.innerHTML = `<h3 style="color: #4CAF50; text-align: center; margin-bottom: 15px;">
    🎉 Opened ${results.length} Chest${results.length > 1 ? 's' : ''}!
  </h3>`;
  container.appendChild(summary);

  // GRID CONTAINER
  const gridContainer = document.createElement("div");
  gridContainer.style.display = "grid";
  gridContainer.style.gridTemplateColumns = "repeat(auto-fill, minmax(180px, 1fr))";
  gridContainer.style.gap = "15px";
  gridContainer.style.padding = "10px";
  gridContainer.style.marginBottom = "15px";

  let totalCollectibles = 0;
  let totalVouchers = 0;
  let totalPotions = 0;

  results.forEach((result, index) => {
    const chestCard = document.createElement("div");
    chestCard.style.display = "flex";
    chestCard.style.flexDirection = "column";
    chestCard.style.alignItems = "center";
    chestCard.style.gap = "8px";
    chestCard.style.padding = "12px";
    chestCard.style.background = "rgba(255,255,255,0.05)";
    chestCard.style.borderRadius = "8px";
    chestCard.style.border = "1px solid #444";
    chestCard.style.minHeight = "120px";

    const chestHeader = document.createElement("div");
    chestHeader.textContent = `Chest ${index + 1}`;
    chestHeader.style.fontWeight = "bold";
    chestHeader.style.color = "#FFA500";
    chestHeader.style.fontSize = "0.9em";
    chestHeader.style.marginBottom = "5px";
    chestCard.appendChild(chestHeader);

    const itemsContainer = document.createElement("div");
    itemsContainer.style.display = "flex";
    itemsContainer.style.flexDirection = "column";
    itemsContainer.style.alignItems = "center";
    itemsContainer.style.gap = "6px";
    itemsContainer.style.width = "100%";

    if (result.collectible) {
      const card = renderCollectibleCard(result.collectible);
      card.style.margin = "0";
      card.style.width = "100%";
      itemsContainer.appendChild(card);
      totalCollectibles++;
    }

    if (result.bonusCollectible) {
      const bonusLabel = document.createElement("div");
      bonusLabel.textContent = "✨ Bonus";
      bonusLabel.style.color = "#FFD700";
      bonusLabel.style.fontSize = "0.8em";
      bonusLabel.style.fontWeight = "bold";
      itemsContainer.appendChild(bonusLabel);
      
      const bonus = renderCollectibleCard(result.bonusCollectible);
      bonus.style.margin = "0";
      bonus.style.width = "100%";
      itemsContainer.appendChild(bonus);
      totalCollectibles++;
    }

    if (result.eventVoucher) {
      const ev = document.createElement("div");
      ev.innerHTML = "🎟️ <strong>Event Voucher</strong>";
      ev.style.color = "#FFD700";
      ev.style.background = "linear-gradient(135deg, #444, #222)";
      ev.style.padding = "8px";
      ev.style.textAlign = "center";
      ev.style.borderRadius = "6px";
      ev.style.border = "1px solid #FFD700";
      ev.style.fontSize = "0.85em";
      ev.style.fontWeight = "bold";
      ev.style.width = "100%";
      itemsContainer.appendChild(ev);
      totalVouchers++;
    }

    if (result.maxPotion) {
      const mp = document.createElement("div");
      mp.innerHTML = "💖 <strong>Max Potion</strong>";
      mp.style.color = "#FF66CC";
      mp.style.background = "linear-gradient(135deg, #444, #222)";
      mp.style.padding = "8px";
      mp.style.textAlign = "center";
      mp.style.borderRadius = "6px";
      mp.style.border = "1px solid #FF66CC";
      mp.style.fontSize = "0.85em";
      mp.style.fontWeight = "bold";
      mp.style.width = "100%";
      itemsContainer.appendChild(mp);
      totalPotions++;
    }

    chestCard.appendChild(itemsContainer);
    gridContainer.appendChild(chestCard);
  });

  container.appendChild(gridContainer);

  const totals = document.createElement("div");
  totals.style.marginTop = "10px";
  totals.style.padding = "12px";
  totals.style.background = "#2a2a2a";
  totals.style.borderRadius = "8px";
  totals.style.textAlign = "center";
  totals.style.fontSize = "0.9em";
  
  let summaryText = `<strong>Total Rewards:</strong> `;
  const parts = [];
  if (totalCollectibles > 0) parts.push(`${totalCollectibles} collectible${totalCollectibles > 1 ? 's' : ''}`);
  if (totalVouchers > 0) parts.push(`${totalVouchers} event voucher${totalVouchers > 1 ? 's' : ''}`);
  if (totalPotions > 0) parts.push(`${totalPotions} max potion${totalPotions > 1 ? 's' : ''}`);
  
  summaryText += parts.join(', ') || 'Nothing (this should not happen)';
  totals.innerHTML = summaryText;
  
  container.appendChild(totals);
}

function clearChestResults() {
  const container = document.getElementById("chest-result");
  if (container) {
    container.innerHTML = "";
  }
}

function openChest(chestId) {
  // Assuming chests, updateQuestProgress, etc. exist
  if (typeof chests === 'undefined') return null;
  
  const chest = chests.find(c => c.id === chestId);
  if (!chest || chest.opened || Date.now() < chest.availableAt) return null;

  chest.opened = true;
  chest.availableAt = Date.now();

  const isEvent = Math.random() < 0.25;
  if (typeof updateQuestProgress !== 'undefined') {
    if (isEvent) updateQuestProgress("event");
    updateQuestProgress("chest");
  }

  // Get all available collectibles and filter by rarity and event status
  const allCollectibles = getAllCollectibles();
  const possible = allCollectibles.filter(c => 
    c.rarity === chest.rarity && (isEvent ? c.event : !c.event)
  );
  
  const collectible = possible[Math.floor(Math.random() * possible.length)];

  let bonusCollectible = null;
  if (chest.rarity === "legendary") {
    bonusCollectible = allCollectibles[Math.floor(Math.random() * allCollectibles.length)];
  }

  let eventVoucherBool = false;
  let maxPotionBool = false;

  if (typeof pityEventVoucher !== 'undefined') {
    pityEventVoucher++;
    if (Math.random() < 0.005 || pityEventVoucher >= 200) {
      eventVoucherBool = true;
      pityEventVoucher = 0;
    }
  }

  if (typeof pityMaxPotion !== 'undefined') {
    pityMaxPotion++;
    if (Math.random() < 0.005 || pityMaxPotion >= 200) {
      maxPotionBool = true;
      pityMaxPotion = 0;
    }
  }

  return {
    collectible,
    bonusCollectible,
    eventVoucher: eventVoucherBool,
    maxPotion: maxPotionBool
  };
}

function openRarityChest(rarity) {
  if (typeof chests === 'undefined') return [];
  
  const unopenedChests = chests.filter(c => c.rarity === rarity && !c.opened);
  if (unopenedChests.length === 0) return [];

  const results = [];

  unopenedChests.forEach(chest => {
    const result = openChest(chest.id);
    if (!result) return;

    if (result.collectible) {
      collectCollectible(result.collectible);
    }

    if (result.bonusCollectible) {
      collectCollectible(result.bonusCollectible);
    }

    // ADD THESE LINES: Actually add the items to inventory
    if (result.eventVoucher && typeof eventVouchers !== 'undefined') {
      eventVouchers++;
    }

    if (result.maxPotion && typeof maxPotions !== 'undefined') {
      maxPotions++;
    }

    results.push(result);
  });

  renderChestButtons();
  if (typeof updateChestRegen !== 'undefined') updateChestRegen();
  if (typeof saveGame !== 'undefined') saveGame();

  return results;
}

function genChests(count = maxChests) {
  if (typeof chests === 'undefined' || typeof maxChests === 'undefined') return;
  
  const chestsToAdd = Math.min(count, maxChests - chests.length);
  
  for (let i = 0; i < chestsToAdd; i++) {
    chests.push({
      id: Date.now() + Math.random(),
      rarity: getRandomRarity(),
      availableAt: Date.now(),
      opened: false
    });
  }

  renderChestButtons();
}

function regenerateChests(amount = 1) {
  if (!Array.isArray(chests) || typeof maxChests === 'undefined') return;

  const now = Date.now();

  chests.splice(0, chests.length, ...chests.filter(chest => !chest.opened));

  const chestsToAdd = Math.min(amount, maxChests - chests.length);
  for (let i = 0; i < chestsToAdd; i++) {
    chests.push({
      id: Date.now() + Math.random(),
      rarity: getRandomRarity(),
      opened: false,
      availableAt: now
    });
  }

  renderChestButtons();
}

function updateChestRegen() {
  if (typeof chests === 'undefined' || typeof maxChests === 'undefined') return;

  const now = Date.now();
  const timerContainer = document.getElementById("chest-timer");
  if (!timerContainer) return;

  // Remove opened chests
  chests.splice(0, chests.length, ...chests.filter(chest => !chest.opened));

  if (chests.length >= maxChests) {
    timerContainer.textContent = `Chests: ${chests.length} / ${maxChests} (max reached)`;
    return;
  }

  if (typeof lastChestRegen === 'undefined' || typeof CHEST_REGEN_INTERVAL === 'undefined') return;

  // --- Adjust interval based on chestRegen boost ---
  const boosts = calculateBoosts();
  const chestRegenMultiplier = boosts.chestRegen || 1;
  let adjustedInterval = CHEST_REGEN_INTERVAL / chestRegenMultiplier;

  // Ensure interval never goes below 1 minute
  adjustedInterval = Math.max(adjustedInterval, 60000);

  // Calculate time since last chest regen
  const timeSinceLast = now - lastChestRegen;

  if (timeSinceLast >= adjustedInterval) {
    regenerateChests();
    lastChestRegen = now;
  }

  // Update UI countdown
  const timeRemaining = Math.max(0, adjustedInterval - timeSinceLast);
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000)
    .toString()
    .padStart(2, "0");

  timerContainer.textContent = `Chests: ${chests.length} / ${maxChests} (next chest in ${minutes}:${seconds})`;
}

function collectCollectible(collectible) {
    if (!collectible || !collectible.id) return;
    
    // Find if player already has this collectible
    const existing = playerCollectibles.find(pc => pc.id === collectible.id);
    
    if (existing) {
        existing.count++;
    } else {
        playerCollectibles.push({
            id: collectible.id,
            count: 1
        });
    }
}

//#endregion

//#region QUESTS TAB
function initializeDailyQuests() {
  dailyQuests = [];
  const shuffled = [...questDefinitions].sort(() => 0.5 - Math.random());
  dailyQuests = shuffled.slice(0, dailyQuestCount).map(q => ({
    ...q,
    id: q.id ?? `daily-${Date.now()}-${i}`,
    progress: 0,
    completedTimes: 0,
  }));
}

function updateQuestProgress(type, options = {}) {
  dailyQuests.forEach(q => {
    // Already fully completed
    if (q.completedTimes >= maxQuestRepeats) return;

    // Match quest type and optional filters
    if (q.type === type) {
      if (q.rarity && options.rarity && q.rarity !== options.rarity) return;

      // Only increment if it won't exceed total allowed repeats
      const maxProgress = (maxQuestRepeats - q.completedTimes) * q.goal;
      if (q.progress < maxProgress) {
        q.progress++;
      }

      // Mark as ready to claim if enough for at least one repeat
      if (q.progress >= q.goal && !q.readyToClaim) {
        q.readyToClaim = true;
        showMessage(`Quest Complete: ${q.desc}!`);
      }
    }
  });

  renderDailyQuests();
  renderConsumableShop();
}

function renderDailyQuests() {
  const container = document.getElementById("quests");
  if (!container) return;

  // Clear old quest items
  container.querySelectorAll(".quest-item").forEach(el => el.remove());

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(250px, 1fr))";
  grid.style.gap = "12px";

  dailyQuests.forEach(q => {
    const remainingRepeats = maxQuestRepeats - q.completedTimes;
    
    // FIX: Ensure currentRepeatProgress is never negative
    const currentRepeatProgress = q.progress; // Now q.progress is just for current repeat
    const currentPercent = Math.min((q.progress / q.goal) * 100, 100);
    const isComplete = q.progress >= q.goal && q.completedTimes < maxQuestRepeats;

    // Quest Card
    const questDiv = document.createElement("div");
    questDiv.className = "quest-item";
    questDiv.style.background = "#3f3f3fff";
    questDiv.style.color = "#f5f5dc";
    questDiv.style.borderRadius = "10px";
    questDiv.style.padding = "12px";
    questDiv.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
    questDiv.style.display = "flex";
    questDiv.style.flexDirection = "column";
    questDiv.style.gap = "6px";

    // Quest title
    const title = document.createElement("div");
    title.style.fontWeight = "bold";
    title.textContent = q.desc;
    questDiv.appendChild(title);

    // Progress bar container
    const progressBarContainer = document.createElement("div");
    progressBarContainer.style.background = "#555";
    progressBarContainer.style.borderRadius = "6px";
    progressBarContainer.style.height = "12px";
    progressBarContainer.style.overflow = "hidden";
    progressBarContainer.style.margin = "6px 0";

    const progressFill = document.createElement("div");
    progressFill.style.width = `${currentPercent}%`;
    progressFill.style.background = "linear-gradient(to right, #4caf50, #8bc34a)";
    progressFill.style.height = "100%";
    progressFill.style.transition = "width 0.3s";

    progressBarContainer.appendChild(progressFill);
    questDiv.appendChild(progressBarContainer);

    // Progress text
    const progressText = document.createElement("div");
    progressText.style.fontSize = "0.9em";
    progressText.textContent = `Progress: ${currentRepeatProgress}/${q.goal}`;
    questDiv.appendChild(progressText);

    // Repeats info
    const repeatsText = document.createElement("div");
    repeatsText.style.fontSize = "0.85em";
    repeatsText.textContent = `Completed repeats: ${q.completedTimes}/${maxQuestRepeats} • Remaining: ${remainingRepeats}`;
    questDiv.appendChild(repeatsText);

    // Reward info
    const rewardText = document.createElement("div");
    rewardText.style.fontSize = "0.9em";
    rewardText.textContent = `${q.rewardGold} Gold • ${q.rewardTokens} Quest Token`;
    questDiv.appendChild(rewardText);

    // Claim button
    if (isComplete) {
      const completeBtn = document.createElement("button");
      completeBtn.className = "move-btn";
      completeBtn.textContent = "Claim Reward";
      completeBtn.style.alignSelf = "center";
      completeBtn.addEventListener("click", () => claimDailyQuestReward(q.id));
      questDiv.appendChild(completeBtn);
    }

    grid.appendChild(questDiv);
  });

  container.appendChild(grid);
}

function claimDailyQuestReward(questId) {
  const q = dailyQuests.find(q => q.id === questId);
  if (!q) return;

  if (q.completedTimes >= maxQuestRepeats) return showMessage("Max repeats reached!");
  if (q.progress < q.goal) return showMessage("Quest not yet complete!");

  const repeatsToClaim = Math.min(
    Math.floor(q.progress / q.goal),
    maxQuestRepeats - q.completedTimes
  );

  if (repeatsToClaim <= 0) return;

  gold += (q.rewardGold || 0) * repeatsToClaim;
  questTokens += (q.rewardTokens || 0) * repeatsToClaim;

  q.completedTimes += repeatsToClaim;
  
  // Keep the subtraction but ensure it's correct
  const claimedProgress = repeatsToClaim * q.goal;
  q.progress = q.progress - claimedProgress;
  
  // Safety check - progress should never be negative with proper math
  if (q.progress < 0) {
    console.warn(`Quest progress went negative: ${q.progress}. Resetting to 0.`);
    q.progress = 0;
  }
  
  q.readyToClaim = q.progress >= q.goal;

  showMessage(`Quest complete! +${(q.rewardGold || 0) * repeatsToClaim} Gold, +${(q.rewardTokens || 0) * repeatsToClaim} Quest Token (Claimed ${repeatsToClaim} repeats, Progress: ${q.progress})`);

  renderDailyQuests();
  renderConsumableShop();
  saveGame();
}

// --- Reset the daily quests (randomize each day) ---
function resetDailyQuests() {
  dailyQuests = [...questDefinitions]
    .sort(() => Math.random() - 0.5)
    .slice(0, dailyQuestCount)
    .map(q => ({
      ...q,
      id: q.id ?? `daily-${Date.now()}-${i}`,
      progress: 0,
      completedTimes: 0,
      rewardClaimed: false
    }));

  lastQuestReset = Date.now();
  showMessage("Daily quests have been refreshed!");
  renderDailyQuests();
  saveGame();
}

function getTimeUntilMidnight() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diff = midnight - now;
  const hours = Math.floor(diff / 1000 / 60 / 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  return `${hours}h ${minutes}m`;
}

function checkDailyQuestReset() {
  const now = new Date();
  const lastResetDate = new Date(lastQuestReset);

  // Compare just the date (ignoring time)
  const nowDateString = now.toDateString();
  const lastDateString = lastResetDate.toDateString();

  if (nowDateString !== lastDateString) {
    resetDailyQuests();
    lastQuestReset = Date.now();
    saveGame();
  }
}
//#endregion

//#region SHOP TAB
// ---------------------- Shop Items ----------------------
const consumableShop = [
  {
    id: "randomChest",
    name: "1 Random Chest",
    costTokens: 2,
    description: "Receive 1 random chest instantly.",
    apply: () => {
      genChests(1);
      showMessage("Random chest added!");
  }
  },
    {
    id: "energy5",
    name: "+5 Instant Energy",
    costTokens: 2,
    description: "Instantly restore 5 energy.",
    apply: () => {
      energy = Math.min(maxEnergy, energy + 5);
      updateEnergyDisplay();
      showMessage("+5 Energy added!");
    }
  },
    {
    id: "instantTame",
    name: "Instant Tame",
    costTokens: 2,
    description: "Instantly complete the current tame.",
    apply: () => {
        const wild = wildQueue.find(d => d.taming);
        if (wild) {
        wild.tamingTimer = 0;      // optional, mainly for UI
        tameDreamling(wild);       // actually process the tame fully
        } else {
        showMessage("No Dreamling is currently being tamed.");
        }
    }
  },
  {
    id: "researchBoost",
    name: "x2 Research Points (15 min)",
    costTokens: 10,
    description: "Double research points gained for 15 minutes.",
    duration: 15 * 60 * 1000,
    apply: () => {
      startTemporaryBoost("researchPoints", 2, 15 * 60 * 1000);
      showMessage("x2 Research Points for 15 minutes!");
    }
  },
  {
    id: "dreamPointsBoost",
    name: "x2 Dream Points (15 min)",
    costTokens: 10,
    description: "Double dream points gained for 15 minutes.",
    duration: 15 * 60 * 1000,
    apply: () => {
      startTemporaryBoost("dreamPoints", 2, 15 * 60 * 1000);
      showMessage("x2 Dream Points for 15 minutes!");
    }
  },
  {
    id: "xpBoost",
    name: "x2 Experience (15 min)",
    costTokens: 10,
    description: "Double XP gained for 15 minutes.",
    duration: 15 * 60 * 1000,
    apply: () => {
      startTemporaryBoost("xp", 2, 15 * 60 * 1000);
      showMessage("x2 Experience for 15 minutes!");
    }
  },
  {
    id: "goldBoost",
    name: "x2 Gold (15 min)",
    costTokens: 10,
    description: "Double gold gained for 15 minutes.",
    duration: 15 * 60 * 1000,
    apply: () => {
      startTemporaryBoost("gold", 2, 15 * 60 * 1000);
      showMessage("x2 Gold for 15 minutes!");
    }
  },
  {
    id: "eventAccess",
    name: "Event Access (6h)",
    costTokens: 15,
    description: "Unlock access to the event area for 6 hours.",
    duration: 6 * 60 * 60 * 1000,
    apply: () => {
      eventAccess = Date.now() + 6 * 60 * 60 * 1000;
      showMessage("Event access unlocked for 6 hours!");
      updateSidebarEventDisplay();
    }
  }
];

// ---------------------- Temporary Boost Manager ----------------------
function startTemporaryBoost(boostName, multiplier, duration) {
  if (!activeTemporaryBoosts) activeTemporaryBoosts = {};

  // Prevent stacking: check if any boost is currently active
  if (Object.keys(activeTemporaryBoosts).length > 0) {
    showMessage("A boost is already active!");
    return;
  }

  activeTemporaryBoosts[boostName] = {
    multiplier,
    expiresAt: Date.now() + duration
  };

  // Start countdown timer for this specific boost
  startBoostCountdown(boostName);

  // Refresh UI to reflect new boost values
  updatePlayerInfo();
  updateGoldDisplay();
  updateDreamPointsDisplay();
  updateResearchPointsDisplay();
  renderConsumableShop();

  console.log(`Started ${boostName} boost: x${multiplier} for ${duration / 1000}s`);
}

function startBoostCountdown(boostName) {
  // Clear existing interval if any
  if (boostTimerIntervals[boostName]) {
    clearInterval(boostTimerIntervals[boostName]);
  }

  // Create new interval
  boostTimerIntervals[boostName] = setInterval(() => {
    const boost = activeTemporaryBoosts?.[boostName];
    
    if (!boost || boost.expiresAt <= Date.now()) {
      // Boost expired
      clearInterval(boostTimerIntervals[boostName]);
      delete boostTimerIntervals[boostName];
      
      if (activeTemporaryBoosts?.[boostName]) {
        delete activeTemporaryBoosts[boostName];
      }
      
      // Update UI
      updatePlayerInfo();
      updateGoldDisplay();
      updateDreamPointsDisplay();
      updateResearchPointsDisplay();
      renderConsumableShop();
      
      showMessage(`${boostName} boost expired!`);
      console.log(`${boostName} boost expired`);
      return;
    }
  }, 1000);
}

function cleanupExpiredBoosts() {
  if (!activeTemporaryBoosts) return;

  const now = Date.now();
  let anyExpired = false;

  for (const [boostName, boost] of Object.entries(activeTemporaryBoosts)) {
    if (boost.expiresAt <= now) {
      delete activeTemporaryBoosts[boostName];
      
      if (boostTimerIntervals[boostName]) {
        clearInterval(boostTimerIntervals[boostName]);
        delete boostTimerIntervals[boostName];
      }
      
      anyExpired = true;
    }
  }

  if (anyExpired) {
    updatePlayerInfo();
    updateGoldDisplay();
    updateDreamPointsDisplay();
    updateResearchPointsDisplay();
    updateActiveBoostsDisplay();
  }
}

// ---------------------- Rendering Shop ----------------------
function renderConsumableShop() {
  const container = document.getElementById("shop");
  if (!container) return;

  container.innerHTML = `
    <h2>Token Shop</h2>
    <div style="margin-bottom:10px">Quest Tokens: ${questTokens}</div>
  `;

  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "repeat(auto-fill, minmax(200px, 1fr))";
  grid.style.gap = "10px";

  // Check if any boost is currently active
  const anyBoostActive = activeTemporaryBoosts && Object.keys(activeTemporaryBoosts).length > 0;

  consumableShop.forEach(item => {
    const card = document.createElement("div");
    card.style.background = "#424242";
    card.style.color = "#fff";
    card.style.borderRadius = "8px";
    card.style.padding = "8px";
    card.style.textAlign = "center";
    card.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";

    // Name & description
    const nameDiv = document.createElement("div");
    nameDiv.style.fontWeight = "bold";
    nameDiv.style.marginBottom = "4px";
    nameDiv.textContent = item.name;

    const descDiv = document.createElement("div");
    descDiv.style.fontSize = "0.85em";
    descDiv.style.marginBottom = "6px";
    descDiv.textContent = item.description;

    const costDiv = document.createElement("div");
    costDiv.textContent = `Cost: ${item.costTokens} Quest Tokens`;

    const buyBtn = document.createElement("button");
    buyBtn.textContent = "Buy";
    buyBtn.style.marginTop = "6px";
    buyBtn.className = "move-btn";

    // Disable all boost buttons if any boost is active
    if (anyBoostActive && item.id.includes("Boost")) {
      buyBtn.disabled = true;
      buyBtn.textContent = "Boost Active!";
      buyBtn.style.cursor = "not-allowed";
      buyBtn.style.opacity = 0.6;
    }

    buyBtn.addEventListener("click", () => {
        if (buyBtn.disabled) return showMessage("A boost is already active!");

        // Not enough tokens
        if (questTokens < item.costTokens) return showMessage("Not enough Quest Tokens!");

        // Special check for Instant Tame
        if (item.id === "instantTame" && !wildQueue.some(d => d.taming)) {
            return showMessage("No Dreamling is currently being tamed.");
        }

        // Deduct tokens and apply item
        questTokens -= item.costTokens;
        item.apply();
        updatePlayerInfo();

        // Refresh shop to update token count and button states
        renderConsumableShop();
    });

    card.appendChild(nameDiv);
    card.appendChild(descDiv);
    card.appendChild(costDiv);
    card.appendChild(buyBtn);

    grid.appendChild(card);
  });

  container.appendChild(grid);
}

//#endregion

//#region GAME LOOP
function giveStarterDreamling() {
    // Generate a Dreamling from the forest area, tamed immediately
    const starter = generateDreamling(false, "forest"); // false = not wild
    starter.id = generateUniqueId();
    starter.isWild = false;
    starter.location = "party";

    // Add to party
    partyDreamlings.push(starter);

    // Log it to the Dream Book as if tamed
    logDreamlingToBook(starter);

    // Refresh UI
    renderAllSections();
    renderWildQueue(); // optional if you want to show it in the party section

    saveGame();
}

function calculateBoosts() {
  // --- Start with base values ---
  const currentBoosts = {
    xp: 1,
    dreamPoints: 1,
    researchPoints: 1,
    star: 1,
    critChance: 1,
    gold: 1,
    goldFlat: 0,
    taming: 1,
    energyRegen: 1,
    chestRegen: 1,
    maxEnergy: maxEnergy,       // global base values
    maxChests: maxChests,
    maxParty: maxPartySize,
    maxTraining: maxTrainingSize,
    maxStorage: maxStorageSize,
    maxQuests: maxQuestRepeats
  };

  // --- Permanent boosts ---
  for (const [key, value] of Object.entries(permanentBoosts || {})) {
    if (!(key in currentBoosts)) continue;

    if (additiveKeys.includes(key)) {
      currentBoosts[key] += value;
    } else {
      currentBoosts[key] *= 1 + value / 100; // ✅ full permanent boost
    }
  }

  // --- Temporary boosts ---
  for (const [key, boost] of Object.entries(activeTemporaryBoosts || {})) {
    if (!(key in currentBoosts)) continue;
    if (!boost || !boost.multiplier || boost.expiresAt <= Date.now()) continue;

    if (additiveKeys.includes(key)) {
      currentBoosts[key] += boost.multiplier; // additive
    } else {
      currentBoosts[key] *= boost.multiplier; // multiplicative
    }
  }

  for (const [boostType, level] of Object.entries(boostLevels)) {
    if (level > 0 && currentBoosts.hasOwnProperty(boostType)) {
      const totalValue = getBoostTotalValue(boostType);
      
      if (boostType.includes("max")) {
        // Additive boosts (maxEnergy, maxChests, etc.)
        currentBoosts[boostType] += totalValue;
      } else {
        // Multiplicative boosts (xp, gold, etc.)
        currentBoosts[boostType] *= (1 + totalValue);
      }
    }
  }

  // --- Party Dreamling boosts ---
  for (const d of partyDreamlings || []) {
    const dreamlingBoost = getDreamlingBoost(d);
    for (const bonus of d.bonusBoosts || []) {
      const key = bonus.type;
      if (!(key in currentBoosts)) continue;

      if (additiveKeys.includes(key)) {
        currentBoosts[key] += dreamlingBoost;
      } else {
        currentBoosts[key] *= 1 + dreamlingBoost / 100;
      }
    }
  }

  return currentBoosts;
}

// --- Apply level up for a single Dreamling ---
function levelUpDreamlingIfNeeded(d) {
  let { currentXP, maxXP } = getLevelXP(d);

  while (d.xp >= maxXP && d.level < d.maxLevel) {
    d.xp -= maxXP;
    d.level++;
    ({ currentXP, maxXP } = getLevelXP(d));
  }

  if (d.level >= d.maxLevel) {
    d.level = d.maxLevel;
    d.xp = 0;
  }
}

function levelUpPlayerIfNeeded() {
  const previousLevel = playerLevel; // Store the level before leveling up
  
  while (playerLevel < 1000) {
    const requiredXP = getRequiredXPForLevel(playerLevel);
    if (playerXP >= requiredXP) {
      playerXP -= requiredXP;
      playerLevel++;
    } else {
      break;
    }
  }

  // Cap at max level
  if (playerLevel >= 5000) {
    playerXP = 0;
  }

  // Check if new areas were unlocked and re-render buttons
  if (playerLevel > previousLevel) {
    const newlyUnlockedAreas = areas.filter(area => 
      playerLevel >= areaUnlockLevels[area] && previousLevel < areaUnlockLevels[area]
    );
    
    if (newlyUnlockedAreas.length > 0) {
      renderWildAreaButtons();
      showMessage(`🎉 New areas unlocked: ${newlyUnlockedAreas.map(capitalize).join(', ')}!`);
    }
  }
}

function getResearchPointsPerSecond(currentBoosts) {
    const partyBase = partyDreamlings.length * 0.1;
    const baseRP = partyBase + releasedPoints;

    // currentBoosts.researchPoints already includes Dreamling contributions
    const globalRPBoost = currentBoosts?.researchPoints ?? 1; // multiplier, e.g., 1.25 = +25%

    const total = baseRP * globalRPBoost;

    return isNaN(total) ? 0 : total;
}

function getGoldPerSecond(currentBoosts) {
    let total = 0;
    for (const pc of playerCollectibles) {
      const collectible = getCollectibleById(pc.id);
      total += collectible.perSecondValue * pc.count;
    }

    const globalGoldBoost = currentBoosts?.gold ?? 1; // multiplier, e.g., 1.25
    total *= globalGoldBoost;

    return isNaN(total) ? 0 : total;
}

function getXPPerSecond(currentBoosts) {
    const baseXP = (partyDreamlings?.length || 0) * 0.5;
    const globalXPBoost = currentBoosts?.xp ?? 1; // multiplier
    return isNaN(baseXP * globalXPBoost) ? 0 : baseXP * globalXPBoost;
}

function getDreamPointsPerSecond(currentBoosts) {
    const baseDP = (partyDreamlings?.length || 0) * 1;
    const globalDPBoost = currentBoosts?.dreamPoints ?? 1; // multiplier
    return isNaN(baseDP * globalDPBoost) ? 0 : baseDP * globalDPBoost;
}

function updateGameBackground() {
    const now = Date.now();
    const lastSaved = parseInt(localStorage.getItem("lastSaved") || now, 10);
    const elapsedMs = now - lastSaved;
    const elapsedSec = elapsedMs / 1000;

    // Cap offline progress (24 hours)
    const maxOfflineHours = 24;
    const maxElapsedMs = maxOfflineHours * 60 * 60 * 1000;
    const cappedElapsedMs = Math.min(elapsedMs, maxElapsedMs);
    const cappedElapsedSec = cappedElapsedMs / 1000;

    // Handle temporary boosts expiration (only remove expired, don't subtract)
    if (activeTemporaryBoosts) {
        const now = Date.now();
        for (const [boostId, boost] of Object.entries(activeTemporaryBoosts)) {
            if (boost.expiresAt <= now) {
                delete activeTemporaryBoosts[boostId];
                console.log(`Boost ${boostId} expired during offline time`);
            }
        }
    }

    // Restart countdowns for remaining boosts (intervals will manage the timer)
    if (activeTemporaryBoosts) {
        for (const boostName of Object.keys(activeTemporaryBoosts)) {
            startBoostCountdown(boostName);
        }
    }

    if (typeof chests !== "undefined") {
    const intervalsPassed = Math.floor(cappedElapsedMs / CHEST_REGEN_INTERVAL);
    
    if (intervalsPassed > 0) {
        const availableSlots = maxChests - chests.length;
        const chestsToRegen = Math.min(intervalsPassed, availableSlots);
        
        if (chestsToRegen > 0) {
            regenerateChests(chestsToRegen); // Pass the number to regenerate at once
        }
        
        lastChestRegen = now;
      }
    }

    if (Array.isArray(wildQueue)) {
        const completedTames = [];
        
        // FIXED: Calculate crit chance once at the start using current boosts
        const currentCritChance = calculateCritChance();

        wildQueue.forEach(d => {
            if (d.taming) {
                // FIXED: Check crit using current calculated chance, not stored value
                if (!d._critChecked) {
                    d._critChecked = true;
                    const critRoll = Math.random();
                    const didCrit = critRoll < currentCritChance;
                                        
                    if (didCrit) {
                        d.tamingTimer = 0;
                    }
                }

                d.tamingTimer = Math.max(0, d.tamingTimer - cappedElapsedSec);
                if (d.tamingTimer === 0) {
                    completedTames.push(d);
                }
            } else {
                d.disappearTimer = Math.max(0, d.disappearTimer - cappedElapsedSec);
            }
        });

        const beforeRemoveCount = wildQueue.length;
        wildQueue = wildQueue.filter(d => d.taming || d.disappearTimer > 0);

        if (beforeRemoveCount > wildQueue.length && isTamingInProgress) {
            const anyStillTaming = wildQueue.some(d => d.taming);
            if (!anyStillTaming) {
                console.warn("Resetting isTamingInProgress - taming Dreamling disappeared");
                isTamingInProgress = false;
            }
        }

        completedTames.forEach(d => {
            if (wildQueue.some(w => w.id === d.id)) {
                tameDreamling(d);
            } else {
                console.warn("Completed tame Dreamling was missing from queue, resetting flag");
                isTamingInProgress = false;
            }
        });

        // Final safety check
        const anyTaming = wildQueue.some(d => d.taming);
        if (!anyTaming && isTamingInProgress) {
            console.warn("Safety reset: No Dreamlings are taming but flag was true");
            isTamingInProgress = false;
        }
    }

    updateChestRegen();
    regenEnergyLoop();

    const boosts = calculateBoosts();

    researchPoints += getResearchPointsPerSecond(boosts) * cappedElapsedSec;
    gold += getGoldPerSecond(boosts) * cappedElapsedSec;
    dreamPoints += getDreamPointsPerSecond(boosts) * cappedElapsedSec;
    playerXP += getXPPerSecond(boosts) * cappedElapsedSec;
    levelUpPlayerIfNeeded();

    for (const d of partyDreamlings || []) {
        d.xp += getXPPerSecond(boosts) * cappedElapsedSec;
        levelUpDreamlingIfNeeded(d);
    }
    for (const d of trainingDreamlings || []) {
        d.xp += getXPPerSecond(boosts) * cappedElapsedSec * 2;
        levelUpDreamlingIfNeeded(d);
    }

    if (Array.isArray(pendingTrades) && pendingTrades.length > 0) {
        const beforeCount = pendingTrades.length;
        pendingTrades = pendingTrades.filter(trade => {
            const expired = now >= trade.expiresAt;
            if (expired) {
                const d = storageDreamlings.find(dl => dl.id === trade.id);
                if (d) {
                    d.pendingTrade = false;
                    d.tradeExpiresAt = null;
                    d.readOnly = false;
                }
            }
            return !expired;
        });
        if (pendingTrades.length !== beforeCount) {
            renderAllSections();
        }
    }

    localStorage.setItem("lastSaved", now);
    saveGame();
}

function renderLoop()
{
    updatePlayerInfo();
    updateDreamPointsDisplay();
    updateResearchPointsDisplay();
    updateGoldDisplay();
    renderAllSections();
    updateSidebarEventDisplay();
    startWildQueueLoop();
    renderBoostUpgrades();
}

//#endregion

//#region SIDE BAR
document.addEventListener("DOMContentLoaded", () => {
  const sidebarItems = document.querySelectorAll("#sidebar ul li");
  const sections = document.querySelectorAll(".tab-section");

  sidebarItems.forEach(item => {
    item.addEventListener("click", () => {
      const targetId = item.getAttribute("data-target");

      const tutorialKey = targetId.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

      // Remove active class from all
      sidebarItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      // Hide all sections
      sections.forEach(sec => sec.style.display = "none");

      // Show target section
      const targetSection = document.getElementById(targetId);
      if (targetSection) targetSection.style.display = "block";

      // Show tutorial for this tab (if not seen)
      showTutorialOverlay(tutorialKey);

      if (targetId === "wild-areas") {
        renderWildQueue();
      }

      if (targetId === "fusion-lab") {
        renderFusionStorage();
      }

      if (targetId === "collection") {
        clearChestResults();
      }
    });
  });
});

// Mobile menu toggle
document.addEventListener('DOMContentLoaded', () => {
  const hamburger = document.getElementById('mobile-menu-toggle');
  const sidebar = document.getElementById('sidebar');
  
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      document.body.classList.toggle('menu-open');
    });
    
    // Close menu when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768) {
        if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
          sidebar.classList.remove('open');
          document.body.classList.remove('menu-open');
        }
      }
    });
    
    // Close menu when clicking a menu item
    sidebar.querySelectorAll('li').forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('open');
          document.body.classList.remove('menu-open');
        }
      });
    });
  }
});

function updateDreamPointsDisplay() {
    const container = document.getElementById("dream-points");
    if (!container) return;

    const formattedDP = Math.floor(dreamPoints).toLocaleString();

    // Get current boosts
    const currentBoosts = calculateBoosts();
    const baseDPPerSec = getDreamPointsPerSecond(currentBoosts);

    // Check for active temporary boost
    const boost = activeTemporaryBoosts.dreamPoints;
    let boostText = "";
    let dpPerSec = baseDPPerSec;

    if (boost && boost.expiresAt > Date.now()) {
        dpPerSec = baseDPPerSec * boost.multiplier;
        const remainingSec = Math.ceil((boost.expiresAt - Date.now()) / 1000);
        boostText = ` x${boost.multiplier} (${formatTime(remainingSec)})`;
    }

    container.innerHTML = `
    <div style="
        display:flex;
        flex-direction:column;
        background: #246da8ff;
        color: #fff;
        padding:6px 10px;
        border-radius:8px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        font-size: 1em;
    ">
        <div>Dream Points</div>
        <div>${formattedDP} (${dpPerSec.toFixed(2)}/sec${boostText})</div>
    </div>
    `;
}

function updateResearchPointsDisplay() {
    const container = document.getElementById("research-points");
    if (!container) return;

    const currentBoosts = calculateBoosts(); // get full boosts
    const baseRPPerSec = getResearchPointsPerSecond(currentBoosts);

    const boost = activeTemporaryBoosts.researchPoints;
    let boostText = "";
    let rpPerSec = baseRPPerSec;

    if (boost && boost.expiresAt > Date.now()) {
        // Multiply by the active temporary boost
        rpPerSec = baseRPPerSec * boost.multiplier;
        const remainingSec = Math.ceil((boost.expiresAt - Date.now()) / 1000);
        boostText = ` x${boost.multiplier} (${formatTime(remainingSec)})`;
    }

    container.innerHTML = `
        <div style="
            display:flex;
            flex-direction:column;
            background: #1b5e20;
            color: #fff;
            padding:6px 10px;
            border-radius:8px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.25);
            font-size: 1em;
        ">
            <div>Research Points</div>
            <div>${Math.floor(researchPoints).toLocaleString()} (${rpPerSec.toFixed(2)}/sec${boostText})</div>
        </div>
    `;
}

function updateGoldDisplay() {
    const container = document.getElementById("gold");
    if (!container) return;

    const formattedGold = Math.floor(gold).toLocaleString();
    const currentBoosts = calculateBoosts();
    const goldPerSec = getGoldPerSecond(currentBoosts);

    // Only use boost info for showing the multiplier and remaining time
    let boostText = "";
    const boost = activeTemporaryBoosts.gold;
    if (boost && boost.expiresAt > Date.now()) {
        const remainingSec = Math.ceil((boost.expiresAt - Date.now()) / 1000);
        boostText = ` x${boost.multiplier} (${formatTime(remainingSec)})`;
    }

    container.innerHTML = `
    <div style="
        display:flex;
        flex-direction:column;
        background: #8b6d1e;
        color: #fff;
        padding:6px 10px;
        border-radius:8px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        font-size: 1em;
    ">
        <div>Gold</div>
        <div>${formattedGold} (${goldPerSec.toFixed(2)}/sec${boostText})</div>
    </div>
    `;
}

function updatePlayerInfo() {
    const container = document.getElementById("player-info");
    if (!container) return;

    const requiredXP = getRequiredXPForLevel(playerLevel);
    const progressPercent = Math.min((playerXP / requiredXP) * 100, 100);

    // Get current boosts
    const currentBoosts = calculateBoosts();
    const baseXPPerSec = getXPPerSecond(currentBoosts);

    // Check for active temporary XP boost
    const boost = activeTemporaryBoosts.experience;
    let boostText = "";
    let xpPerSec = baseXPPerSec;

    if (boost && boost.expiresAt > Date.now()) {
        xpPerSec = baseXPPerSec * boost.multiplier;
        const remainingSec = Math.ceil((boost.expiresAt - Date.now()) / 1000);
        boostText = ` x${boost.multiplier} (${formatTime(remainingSec)})`;
    }

    container.innerHTML = `
    <div style="margin-bottom:4px; font-weight:bold;">Level ${playerLevel}</div>
    <div style="background:#ccc; border-radius:4px; height:16px; overflow:hidden; width:100%;">
        <div style="
            background: linear-gradient(to right, #4caf50, #8bc34a);
            width:${progressPercent}%;
            height:100%;
            transition: width 0.5s;
        "></div>
    </div>
    <div style="font-size:0.9em; text-align:right;">
        ${Math.floor(playerXP).toLocaleString()} / ${Math.ceil(requiredXP).toLocaleString()}<br>
        XP/sec: ${xpPerSec.toFixed(2)}${boostText}
    </div>
    `;
}

function updateSidebarEventDisplay() {
    const status = document.getElementById("event-status");
    const vouchers = document.getElementById("event-vouchers");
    if (!status || !vouchers) return;

    if (eventAccess && Date.now() < eventAccess) {
        const remaining = Math.max(0, eventAccess - Date.now());
        const h = Math.floor(remaining / 3600000);
        const m = Math.floor((remaining % 3600000) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        status.textContent = `Event Access: ${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
    } else {
        status.textContent = "No Event Access";
    }

    vouchers.textContent = `Vouchers: ${eventVouchers}`;
}

function getRequiredXPForLevel(level) {
    if (level === 1) return 15000;
    return Math.floor(15000 * Math.pow(level - 1, 1.58));
}
//#endregion

function getToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      z-index: 1000;
    `;
    document.body.appendChild(container);
  }
  return container;
}

function showMessage(text, duration = 5000) {
  const container = getToastContainer();
  
  const toast = document.createElement('div');
  toast.textContent = text;
  toast.style.cssText = `
    background: #3b3b3bcc;
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    animation: slideIn 0.3s ease-out forwards;
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function showConfirm(message, onConfirm, onCancel = () => {}) {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #3b3b3bcc;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  // Create dialog box
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background: #3b3b3bcc;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    max-width: 400px;
    text-align: center;
  `;
  
  // Message text
  const text = document.createElement('p');
  text.textContent = message;
  text.style.cssText = `
    margin: 0 0 20px 0;
    font-size: 16px;
    color: #f5f5dc;
  `;
  
  // Button container
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    gap: 10px;
    justify-content: center;
  `;
  
  // Cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = `
    padding: 10px 20px;
    border: 2px solid #666;
    background: #f5f5dc;
    color: #666;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
  `;
  cancelBtn.onmouseover = () => cancelBtn.style.background = '#f0f0f0';
  cancelBtn.onmouseout = () => cancelBtn.style.background = 'white';
  
  // Confirm button
  const confirmBtn = document.createElement('button');
  confirmBtn.textContent = 'Confirm';
  confirmBtn.style.cssText = `
    padding: 10px 20px;
    border: none;
    background: #d9534f;
    color: #f5f5dc;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
  `;
  confirmBtn.onmouseover = () => confirmBtn.style.background = '#c9302c';
  confirmBtn.onmouseout = () => confirmBtn.style.background = '#d9534f';
  
  // Event handlers
  cancelBtn.onclick = () => {
    overlay.remove();
    onCancel();
  };
  
  confirmBtn.onclick = () => {
    overlay.remove();
    onConfirm();
  };
  
  // Assemble dialog
  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(confirmBtn);
  dialog.appendChild(text);
  dialog.appendChild(buttonContainer);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

document.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem("dreamGameSave");
    if (!saved) {
        // No saved game, give starter
        giveStarterDreamling();

        if (dailyQuests.length === 0) {
            initializeDailyQuests();
        }
    } else {
        // Load saved game
        loadGame();
    }

    renderPendingTradesSafe();

    renderWildAreaButtons();
    renderAvailableDreamlings(selectedArea || "forest");
    initEnergy();
    updateEnergyDisplay();

    renderFusionStorage();

    initializeBoostUpgrades();
    applyBoostUpgrades();
    renderBoostUpgrades();

    renderChestButtons();

    renderCollectibleGroupButtons();
    checkDailyQuestReset();
    renderDailyQuests();

    renderTrophyHall();
    renderConsumableShop();

    updateGameBackground();

    setInterval(cleanupExpiredQRCodes, 60 * 60 * 1000); // every hour
    setInterval(checkDailyQuestReset, 60 * 1000); // every minute
    setInterval(cleanupExpiredBoosts, 5000); // every 5 seconds
    setInterval(updateGameBackground, 1000); // every second
    setInterval(renderLoop, 1000); // every second
});
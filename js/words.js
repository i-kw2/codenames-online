(function (global) {
  'use strict';
  const CN = global.Codenames = global.Codenames || {};

  // Original generic bilingual word pool. No commercial card list is copied.
  // قائمة كلمات عامة أصلية ثنائية اللغة، ولا يتم نسخ مجموعة بطاقات تجارية.
  CN.DEFAULT_WORDS = [
  {
    "id": "moon",
    "ar": "قمر",
    "en": "Moon"
  },
  {
    "id": "sun",
    "ar": "شمس",
    "en": "Sun"
  },
  {
    "id": "star",
    "ar": "نجمة",
    "en": "Star"
  },
  {
    "id": "sky",
    "ar": "سماء",
    "en": "Sky"
  },
  {
    "id": "cloud",
    "ar": "سحابة",
    "en": "Cloud"
  },
  {
    "id": "rain",
    "ar": "مطر",
    "en": "Rain"
  },
  {
    "id": "snow",
    "ar": "ثلج",
    "en": "Snow"
  },
  {
    "id": "wind",
    "ar": "رياح",
    "en": "Wind"
  },
  {
    "id": "storm",
    "ar": "عاصفة",
    "en": "Storm"
  },
  {
    "id": "river",
    "ar": "نهر",
    "en": "River"
  },
  {
    "id": "sea",
    "ar": "بحر",
    "en": "Sea"
  },
  {
    "id": "ocean",
    "ar": "محيط",
    "en": "Ocean"
  },
  {
    "id": "lake",
    "ar": "بحيرة",
    "en": "Lake"
  },
  {
    "id": "island",
    "ar": "جزيرة",
    "en": "Island"
  },
  {
    "id": "mountain",
    "ar": "جبل",
    "en": "Mountain"
  },
  {
    "id": "desert",
    "ar": "صحراء",
    "en": "Desert"
  },
  {
    "id": "forest",
    "ar": "غابة",
    "en": "Forest"
  },
  {
    "id": "tree",
    "ar": "شجرة",
    "en": "Tree"
  },
  {
    "id": "flower",
    "ar": "زهرة",
    "en": "Flower"
  },
  {
    "id": "grass",
    "ar": "عشب",
    "en": "Grass"
  },
  {
    "id": "stone",
    "ar": "حجر",
    "en": "Stone"
  },
  {
    "id": "sand",
    "ar": "رمل",
    "en": "Sand"
  },
  {
    "id": "fire",
    "ar": "نار",
    "en": "Fire"
  },
  {
    "id": "ice",
    "ar": "جليد",
    "en": "Ice"
  },
  {
    "id": "earth",
    "ar": "أرض",
    "en": "Earth"
  },
  {
    "id": "world",
    "ar": "عالم",
    "en": "World"
  },
  {
    "id": "space",
    "ar": "فضاء",
    "en": "Space"
  },
  {
    "id": "planet",
    "ar": "كوكب",
    "en": "Planet"
  },
  {
    "id": "comet",
    "ar": "مذنب",
    "en": "Comet"
  },
  {
    "id": "rocket",
    "ar": "صاروخ",
    "en": "Rocket"
  },
  {
    "id": "house",
    "ar": "منزل",
    "en": "House"
  },
  {
    "id": "door",
    "ar": "باب",
    "en": "Door"
  },
  {
    "id": "window",
    "ar": "نافذة",
    "en": "Window"
  },
  {
    "id": "room",
    "ar": "غرفة",
    "en": "Room"
  },
  {
    "id": "kitchen",
    "ar": "مطبخ",
    "en": "Kitchen"
  },
  {
    "id": "chair",
    "ar": "كرسي",
    "en": "Chair"
  },
  {
    "id": "table",
    "ar": "طاولة",
    "en": "Table"
  },
  {
    "id": "lamp",
    "ar": "مصباح",
    "en": "Lamp"
  },
  {
    "id": "mirror",
    "ar": "مرآة",
    "en": "Mirror"
  },
  {
    "id": "bed",
    "ar": "سرير",
    "en": "Bed"
  },
  {
    "id": "clock",
    "ar": "ساعة",
    "en": "Clock"
  },
  {
    "id": "key",
    "ar": "مفتاح",
    "en": "Key"
  },
  {
    "id": "box",
    "ar": "صندوق",
    "en": "Box"
  },
  {
    "id": "bag",
    "ar": "حقيبة",
    "en": "Bag"
  },
  {
    "id": "book",
    "ar": "كتاب",
    "en": "Book"
  },
  {
    "id": "paper",
    "ar": "ورق",
    "en": "Paper"
  },
  {
    "id": "pen",
    "ar": "قلم",
    "en": "Pen"
  },
  {
    "id": "pencil",
    "ar": "قلم رصاص",
    "en": "Pencil"
  },
  {
    "id": "letter",
    "ar": "رسالة",
    "en": "Letter"
  },
  {
    "id": "map",
    "ar": "خريطة",
    "en": "Map"
  },
  {
    "id": "car",
    "ar": "سيارة",
    "en": "Car"
  },
  {
    "id": "bus",
    "ar": "حافلة",
    "en": "Bus"
  },
  {
    "id": "train",
    "ar": "قطار",
    "en": "Train"
  },
  {
    "id": "plane",
    "ar": "طائرة",
    "en": "Plane"
  },
  {
    "id": "ship",
    "ar": "سفينة",
    "en": "Ship"
  },
  {
    "id": "boat",
    "ar": "قارب",
    "en": "Boat"
  },
  {
    "id": "bike",
    "ar": "دراجة",
    "en": "Bicycle"
  },
  {
    "id": "road",
    "ar": "طريق",
    "en": "Road"
  },
  {
    "id": "bridge",
    "ar": "جسر",
    "en": "Bridge"
  },
  {
    "id": "station",
    "ar": "محطة",
    "en": "Station"
  },
  {
    "id": "airport",
    "ar": "مطار",
    "en": "Airport"
  },
  {
    "id": "ticket",
    "ar": "تذكرة",
    "en": "Ticket"
  },
  {
    "id": "wheel",
    "ar": "عجلة",
    "en": "Wheel"
  },
  {
    "id": "engine",
    "ar": "محرك",
    "en": "Engine"
  },
  {
    "id": "traffic",
    "ar": "مرور",
    "en": "Traffic"
  },
  {
    "id": "street",
    "ar": "شارع",
    "en": "Street"
  },
  {
    "id": "city",
    "ar": "مدينة",
    "en": "City"
  },
  {
    "id": "village",
    "ar": "قرية",
    "en": "Village"
  },
  {
    "id": "tower",
    "ar": "برج",
    "en": "Tower"
  },
  {
    "id": "castle",
    "ar": "قلعة",
    "en": "Castle"
  },
  {
    "id": "school",
    "ar": "مدرسة",
    "en": "School"
  },
  {
    "id": "university",
    "ar": "جامعة",
    "en": "University"
  },
  {
    "id": "office",
    "ar": "مكتب",
    "en": "Office"
  },
  {
    "id": "hospital",
    "ar": "مستشفى",
    "en": "Hospital"
  },
  {
    "id": "market",
    "ar": "سوق",
    "en": "Market"
  },
  {
    "id": "shop",
    "ar": "متجر",
    "en": "Shop"
  },
  {
    "id": "bank",
    "ar": "بنك",
    "en": "Bank"
  },
  {
    "id": "hotel",
    "ar": "فندق",
    "en": "Hotel"
  },
  {
    "id": "restaurant",
    "ar": "مطعم",
    "en": "Restaurant"
  },
  {
    "id": "museum",
    "ar": "متحف",
    "en": "Museum"
  },
  {
    "id": "library",
    "ar": "مكتبة",
    "en": "Library"
  },
  {
    "id": "theatre",
    "ar": "مسرح",
    "en": "Theatre"
  },
  {
    "id": "garden",
    "ar": "حديقة",
    "en": "Garden"
  },
  {
    "id": "park",
    "ar": "منتزه",
    "en": "Park"
  },
  {
    "id": "factory",
    "ar": "مصنع",
    "en": "Factory"
  },
  {
    "id": "farm",
    "ar": "مزرعة",
    "en": "Farm"
  },
  {
    "id": "stadium",
    "ar": "ملعب",
    "en": "Stadium"
  },
  {
    "id": "court",
    "ar": "محكمة",
    "en": "Court"
  },
  {
    "id": "port",
    "ar": "ميناء",
    "en": "Port"
  },
  {
    "id": "palace",
    "ar": "قصر",
    "en": "Palace"
  },
  {
    "id": "doctor",
    "ar": "طبيب",
    "en": "Doctor"
  },
  {
    "id": "teacher",
    "ar": "معلم",
    "en": "Teacher"
  },
  {
    "id": "engineer",
    "ar": "مهندس",
    "en": "Engineer"
  },
  {
    "id": "artist",
    "ar": "فنان",
    "en": "Artist"
  },
  {
    "id": "chef",
    "ar": "طاه",
    "en": "Chef"
  },
  {
    "id": "pilot",
    "ar": "طيار",
    "en": "Pilot"
  },
  {
    "id": "driver",
    "ar": "سائق",
    "en": "Driver"
  },
  {
    "id": "farmer",
    "ar": "مزارع",
    "en": "Farmer"
  },
  {
    "id": "judge",
    "ar": "قاض",
    "en": "Judge"
  },
  {
    "id": "guard",
    "ar": "حارس",
    "en": "Guard"
  },
  {
    "id": "student",
    "ar": "طالب",
    "en": "Student"
  },
  {
    "id": "child",
    "ar": "طفل",
    "en": "Child"
  },
  {
    "id": "friend",
    "ar": "صديق",
    "en": "Friend"
  },
  {
    "id": "family",
    "ar": "عائلة",
    "en": "Family"
  },
  {
    "id": "king",
    "ar": "ملك",
    "en": "King"
  },
  {
    "id": "queen",
    "ar": "ملكة",
    "en": "Queen"
  },
  {
    "id": "prince",
    "ar": "أمير",
    "en": "Prince"
  },
  {
    "id": "captain",
    "ar": "قبطان",
    "en": "Captain"
  },
  {
    "id": "soldier",
    "ar": "جندي",
    "en": "Soldier"
  },
  {
    "id": "detective",
    "ar": "محقق",
    "en": "Detective"
  },
  {
    "id": "cat",
    "ar": "قط",
    "en": "Cat"
  },
  {
    "id": "dog",
    "ar": "كلب",
    "en": "Dog"
  },
  {
    "id": "horse",
    "ar": "حصان",
    "en": "Horse"
  },
  {
    "id": "lion",
    "ar": "أسد",
    "en": "Lion"
  },
  {
    "id": "tiger",
    "ar": "نمر",
    "en": "Tiger"
  },
  {
    "id": "elephant",
    "ar": "فيل",
    "en": "Elephant"
  },
  {
    "id": "camel",
    "ar": "جمل",
    "en": "Camel"
  },
  {
    "id": "bird",
    "ar": "طائر",
    "en": "Bird"
  },
  {
    "id": "fish",
    "ar": "سمكة",
    "en": "Fish"
  },
  {
    "id": "whale",
    "ar": "حوت",
    "en": "Whale"
  },
  {
    "id": "shark",
    "ar": "قرش",
    "en": "Shark"
  },
  {
    "id": "snake",
    "ar": "ثعبان",
    "en": "Snake"
  },
  {
    "id": "rabbit",
    "ar": "أرنب",
    "en": "Rabbit"
  },
  {
    "id": "bear",
    "ar": "دب",
    "en": "Bear"
  },
  {
    "id": "wolf",
    "ar": "ذئب",
    "en": "Wolf"
  },
  {
    "id": "monkey",
    "ar": "قرد",
    "en": "Monkey"
  },
  {
    "id": "bee",
    "ar": "نحلة",
    "en": "Bee"
  },
  {
    "id": "butterfly",
    "ar": "فراشة",
    "en": "Butterfly"
  },
  {
    "id": "eagle",
    "ar": "نسر",
    "en": "Eagle"
  },
  {
    "id": "penguin",
    "ar": "بطريق",
    "en": "Penguin"
  },
  {
    "id": "apple",
    "ar": "تفاحة",
    "en": "Apple"
  },
  {
    "id": "orange",
    "ar": "برتقالة",
    "en": "Orange"
  },
  {
    "id": "banana",
    "ar": "موز",
    "en": "Banana"
  },
  {
    "id": "grape",
    "ar": "عنب",
    "en": "Grape"
  },
  {
    "id": "lemon",
    "ar": "ليمون",
    "en": "Lemon"
  },
  {
    "id": "bread",
    "ar": "خبز",
    "en": "Bread"
  },
  {
    "id": "rice",
    "ar": "أرز",
    "en": "Rice"
  },
  {
    "id": "cheese",
    "ar": "جبن",
    "en": "Cheese"
  },
  {
    "id": "milk",
    "ar": "حليب",
    "en": "Milk"
  },
  {
    "id": "coffee",
    "ar": "قهوة",
    "en": "Coffee"
  },
  {
    "id": "tea",
    "ar": "شاي",
    "en": "Tea"
  },
  {
    "id": "water",
    "ar": "ماء",
    "en": "Water"
  },
  {
    "id": "sugar",
    "ar": "سكر",
    "en": "Sugar"
  },
  {
    "id": "salt",
    "ar": "ملح",
    "en": "Salt"
  },
  {
    "id": "honey",
    "ar": "عسل",
    "en": "Honey"
  },
  {
    "id": "cake",
    "ar": "كعكة",
    "en": "Cake"
  },
  {
    "id": "chocolate",
    "ar": "شوكولاتة",
    "en": "Chocolate"
  },
  {
    "id": "egg",
    "ar": "بيضة",
    "en": "Egg"
  },
  {
    "id": "meat",
    "ar": "لحم",
    "en": "Meat"
  },
  {
    "id": "soup",
    "ar": "حساء",
    "en": "Soup"
  },
  {
    "id": "hand",
    "ar": "يد",
    "en": "Hand"
  },
  {
    "id": "eye",
    "ar": "عين",
    "en": "Eye"
  },
  {
    "id": "ear",
    "ar": "أذن",
    "en": "Ear"
  },
  {
    "id": "nose",
    "ar": "أنف",
    "en": "Nose"
  },
  {
    "id": "heart",
    "ar": "قلب",
    "en": "Heart"
  },
  {
    "id": "head",
    "ar": "رأس",
    "en": "Head"
  },
  {
    "id": "foot",
    "ar": "قدم",
    "en": "Foot"
  },
  {
    "id": "face",
    "ar": "وجه",
    "en": "Face"
  },
  {
    "id": "voice",
    "ar": "صوت",
    "en": "Voice"
  },
  {
    "id": "smile",
    "ar": "ابتسامة",
    "en": "Smile"
  },
  {
    "id": "dream",
    "ar": "حلم",
    "en": "Dream"
  },
  {
    "id": "memory",
    "ar": "ذاكرة",
    "en": "Memory"
  },
  {
    "id": "idea",
    "ar": "فكرة",
    "en": "Idea"
  },
  {
    "id": "secret",
    "ar": "سر",
    "en": "Secret"
  },
  {
    "id": "shadow",
    "ar": "ظل",
    "en": "Shadow"
  },
  {
    "id": "light",
    "ar": "ضوء",
    "en": "Light"
  },
  {
    "id": "color",
    "ar": "لون",
    "en": "Color"
  },
  {
    "id": "sound",
    "ar": "نغمة",
    "en": "Sound"
  },
  {
    "id": "music",
    "ar": "موسيقى",
    "en": "Music"
  },
  {
    "id": "dance",
    "ar": "رقص",
    "en": "Dance"
  },
  {
    "id": "piano",
    "ar": "بيانو",
    "en": "Piano"
  },
  {
    "id": "drum",
    "ar": "طبل",
    "en": "Drum"
  },
  {
    "id": "guitar",
    "ar": "غيتار",
    "en": "Guitar"
  },
  {
    "id": "camera",
    "ar": "كاميرا",
    "en": "Camera"
  },
  {
    "id": "photo",
    "ar": "صورة",
    "en": "Photo"
  },
  {
    "id": "phone",
    "ar": "هاتف",
    "en": "Phone"
  },
  {
    "id": "computer",
    "ar": "حاسوب",
    "en": "Computer"
  },
  {
    "id": "screen",
    "ar": "شاشة",
    "en": "Screen"
  },
  {
    "id": "robot",
    "ar": "روبوت",
    "en": "Robot"
  },
  {
    "id": "machine",
    "ar": "آلة",
    "en": "Machine"
  },
  {
    "id": "battery",
    "ar": "بطارية",
    "en": "Battery"
  },
  {
    "id": "cable",
    "ar": "كابل",
    "en": "Cable"
  },
  {
    "id": "radio",
    "ar": "راديو",
    "en": "Radio"
  },
  {
    "id": "internet",
    "ar": "إنترنت",
    "en": "Internet"
  },
  {
    "id": "game",
    "ar": "لعبة",
    "en": "Game"
  },
  {
    "id": "ball",
    "ar": "كرة",
    "en": "Ball"
  },
  {
    "id": "goal",
    "ar": "هدف",
    "en": "Goal"
  },
  {
    "id": "race",
    "ar": "سباق",
    "en": "Race"
  },
  {
    "id": "medal",
    "ar": "ميدالية",
    "en": "Medal"
  },
  {
    "id": "team",
    "ar": "فريق",
    "en": "Team"
  },
  {
    "id": "gold",
    "ar": "ذهب",
    "en": "Gold"
  },
  {
    "id": "silver",
    "ar": "فضة",
    "en": "Silver"
  },
  {
    "id": "diamond",
    "ar": "ألماس",
    "en": "Diamond"
  },
  {
    "id": "ring",
    "ar": "خاتم",
    "en": "Ring"
  },
  {
    "id": "crown",
    "ar": "تاج",
    "en": "Crown"
  },
  {
    "id": "money",
    "ar": "مال",
    "en": "Money"
  },
  {
    "id": "coin",
    "ar": "عملة",
    "en": "Coin"
  },
  {
    "id": "gift",
    "ar": "هدية",
    "en": "Gift"
  },
  {
    "id": "mask",
    "ar": "قناع",
    "en": "Mask"
  },
  {
    "id": "sword",
    "ar": "سيف",
    "en": "Sword"
  },
  {
    "id": "shield",
    "ar": "درع",
    "en": "Shield"
  },
  {
    "id": "rope",
    "ar": "حبل",
    "en": "Rope"
  },
  {
    "id": "brush",
    "ar": "فرشاة",
    "en": "Brush"
  },
  {
    "id": "bottle",
    "ar": "زجاجة",
    "en": "Bottle"
  },
  {
    "id": "glass",
    "ar": "كأس",
    "en": "Glass"
  },
  {
    "id": "umbrella",
    "ar": "مظلة",
    "en": "Umbrella"
  },
  {
    "id": "shoe",
    "ar": "حذاء",
    "en": "Shoe"
  },
  {
    "id": "shirt",
    "ar": "قميص",
    "en": "Shirt"
  },
  {
    "id": "hat",
    "ar": "قبعة",
    "en": "Hat"
  },
  {
    "id": "coat",
    "ar": "معطف",
    "en": "Coat"
  }
];
})(window);

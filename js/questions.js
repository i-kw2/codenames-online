const q = (id, category, en, ar, answers) => ({
  id,
  category,
  question: { en, ar },
  answers: answers.map((a, index) => ({
    id: `${id}_a${index + 1}`,
    text: { en: a[0], ar: a[1] },
    points: a[2],
    aliases: {
      en: [...new Set([a[0], ...(a[3] || [])])],
      ar: [...new Set([a[1], ...(a[4] || [])])]
    }
  }))
});

export const BUILTIN_QUESTIONS = [
  q('travel_beach_001','travel','Name something people usually take to the beach.','اذكر شيئًا يأخذه الناس عادةً إلى الشاطئ.',[
    ['Towel','منشفة',30,['beach towel'],['فوطة','فوطة بحر']],['Sunscreen','واقي شمس',24,['sun cream','sunblock'],['كريم شمس']],['Water','ماء',18,['water bottle'],['موية','قنينة ماء']],['Sunglasses','نظارات شمسية',13,['shades'],['نظارة شمسية']],['Food','طعام',9,['snacks'],['أكل','سناك']],['Umbrella','مظلة',6,['beach umbrella'],['شمسية']]
  ]),
  q('food_burger_002','food','Name something people put on a hamburger.','اذكر شيئًا يضعه الناس على الهمبرغر.',[
    ['Cheese','جبن',31,['cheddar'],['جبنة']],['Ketchup','كاتشب',24,[],[]],['Lettuce','خس',17,[],[]],['Onion','بصل',12,['onions'],[]],['Pickles','مخلل',9,['pickle'],['مخللات']],['Mustard','خردل',7,[],[]]
  ]),
  q('home_morning_003','daily','Name something people do soon after waking up.','اذكر شيئًا يفعله الناس بعد الاستيقاظ بقليل.',[
    ['Brush teeth','تفريش الأسنان',28,['brush my teeth','brush teeth'],['أفرش أسناني','فرش الأسنان']],['Check phone','تفقد الهاتف',24,['check my phone'],['أشيك الجوال','الهاتف']],['Use bathroom','دخول الحمام',20,['go to bathroom','toilet'],['الحمام']],['Drink coffee','شرب القهوة',15,['coffee'],['قهوة']],['Shower','الاستحمام',8,['take a shower'],['شاور']],['Breakfast','الإفطار',5,['eat breakfast'],['فطور']]
  ]),
  q('school_bag_004','school','Name something a student carries in a school bag.','اذكر شيئًا يحمله الطالب في حقيبته المدرسية.',[
    ['Books','كتب',30,['book'],['كتاب']],['Pens','أقلام',24,['pen','pencil'],['قلم','أقلام رصاص']],['Notebook','دفتر',20,['notebook','copybook'],['كراسة']],['Laptop','لابتوب',12,['computer'],['حاسوب','كمبيوتر']],['Water bottle','قنينة ماء',8,['water'],['ماء']],['Lunch','وجبة غداء',6,['food','snack'],['أكل','سناك']]
  ]),
  q('work_meeting_005','work','Name something people bring to a work meeting.','اذكر شيئًا يحضره الناس إلى اجتماع العمل.',[
    ['Laptop','لابتوب',30,['computer'],['كمبيوتر']],['Notebook','دفتر ملاحظات',24,['notepad'],['دفتر']],['Phone','هاتف',18,['mobile','cell phone'],['جوال','تلفون']],['Coffee','قهوة',14,[],[]],['Pen','قلم',9,[],[]],['Documents','مستندات',5,['papers','files'],['أوراق','ملفات']]
  ]),
  q('tech_phone_006','technology','Name something people use a smartphone for every day.','اذكر شيئًا يستخدم الناس الهاتف الذكي من أجله يوميًا.',[
    ['Messages','الرسائل',26,['texting','chat'],['مراسلة','دردشة']],['Social media','وسائل التواصل',23,['social networks'],['سوشيال ميديا']],['Calls','المكالمات',19,['phone calls'],['اتصال','اتصالات']],['Photos','التصوير',14,['camera','pictures'],['صور','كاميرا']],['Maps','الخرائط',10,['navigation','gps'],['ملاحة']],['Music','الموسيقى',8,['listen to music'],['أغاني']]
  ]),
  q('family_weekend_007','family','Name something families often do together on weekends.','اذكر شيئًا تفعله العائلات معًا غالبًا في عطلة نهاية الأسبوع.',[
    ['Eat out','تناول الطعام خارج المنزل',27,['restaurant','dinner out'],['مطعم','عشاء خارج البيت']],['Visit relatives','زيارة الأقارب',23,['family visit'],['زيارة الأهل']],['Watch movies','مشاهدة الأفلام',18,['movie','cinema'],['فيلم','سينما']],['Go shopping','التسوق',14,['shopping'],['سوق']],['Go to park','الذهاب إلى الحديقة',10,['park'],['حديقة']],['Play games','لعب الألعاب',8,['games'],['ألعاب']]
  ]),
  q('friends_hangout_008','friends','Name a place friends meet to hang out.','اذكر مكانًا يلتقي فيه الأصدقاء لقضاء الوقت.',[
    ['Cafe','مقهى',30,['coffee shop'],['كافيه','كوفي']],['Restaurant','مطعم',22,[],[]],['Mall','مجمع تجاري',18,['shopping mall'],['مول']],['Home','المنزل',14,['house'],['بيت']],['Park','حديقة',9,[],[]],['Beach','شاطئ',7,[],[]]
  ]),
  q('sports_equipment_009','sports','Name something used in a football match.','اذكر شيئًا يُستخدم في مباراة كرة قدم.',[
    ['Ball','كرة',36,['football','soccer ball'],['كورة']],['Goal','مرمى',22,['goalpost'],['قول']],['Whistle','صافرة',14,[],[]],['Cards','بطاقات الحكم',11,['yellow card','red card'],['كرت','بطاقة']],['Boots','حذاء رياضي',9,['cleats','shoes'],['حذاء','جزمة']],['Jersey','قميص الفريق',8,['shirt','kit'],['تيشيرت','فانيلة']]
  ]),
  q('entertainment_cinema_010','entertainment','Name something people buy at a cinema.','اذكر شيئًا يشتريه الناس في السينما.',[
    ['Popcorn','فشار',38,[],[]],['Drink','مشروب',25,['soda','soft drink'],['بيبسي','عصير']],['Candy','حلويات',14,['sweets'],['حلاو']],['Nachos','ناتشوز',9,[],[]],['Tickets','تذاكر',8,['ticket'],['تذكرة']],['Ice cream','آيس كريم',6,[],['بوظة']]
  ]),
  q('shopping_supermarket_011','shopping','Name something people often forget to buy at the supermarket.','اذكر شيئًا ينسى الناس شراءه من السوبرماركت غالبًا.',[
    ['Milk','حليب',24,[],['لبن']],['Bread','خبز',22,[],['عيش']],['Eggs','بيض',18,[],[]],['Toilet paper','مناديل حمام',14,['tissue'],['ورق حمام']],['Water','ماء',12,[],['موية']],['Batteries','بطاريات',10,['battery'],[]]
  ]),
  q('holiday_travel_012','holidays','Name something people check before going on holiday.','اذكر شيئًا يتحقق منه الناس قبل السفر في الإجازة.',[
    ['Passport','جواز السفر',31,['passport validity'],['الجواز']],['Tickets','التذاكر',22,['flight ticket'],['تذكرة']],['Hotel','الفندق',18,['booking','reservation'],['الحجز']],['Weather','الطقس',13,['forecast'],['الجو']],['Luggage','الأمتعة',10,['bags'],['الشنط','الحقائب']],['Money','المال',6,['cash','cards'],['فلوس','نقود']]
  ]),
  q('cars_dashboard_013','cars','Name something found on a car dashboard.','اذكر شيئًا يوجد في لوحة عدادات السيارة.',[
    ['Speedometer','عداد السرعة',30,['speed gauge'],['عداد']],['Fuel gauge','عداد الوقود',23,['gas gauge'],['عداد البنزين']],['Navigation','نظام الملاحة',17,['gps','map'],['خرائط','جي بي اس']],['Warning lights','لمبات التحذير',13,['warning light'],['إشارات تحذير']],['Radio','راديو',10,['stereo'],['مسجل']],['Clock','ساعة',7,[],[]]
  ]),
  q('animals_pet_014','animals','Name a common household pet.','اذكر حيوانًا أليفًا شائعًا في المنزل.',[
    ['Cat','قطة',34,['cats'],['قط','بسة']],['Dog','كلب',30,['dogs'],[]],['Bird','طائر',14,['birds'],['عصفور']],['Fish','سمك',10,['goldfish'],['سمكة']],['Rabbit','أرنب',7,['bunny'],[]],['Turtle','سلحفاة',5,[],[]]
  ]),
  q('gulf_diwan_015','gulf','Name something commonly served to guests in the Gulf.','اذكر شيئًا يُقدَّم للضيوف عادةً في الخليج.',[
    ['Arabic coffee','قهوة عربية',35,['gahwa','coffee'],['قهوة','قهوة عربية']],['Dates','تمر',26,['date'],[]],['Tea','شاي',16,[],[]],['Sweets','حلويات',11,['dessert'],['حلا']],['Water','ماء',7,[],['موية']],['Juice','عصير',5,[],[]]
  ]),
  q('daily_late_016','daily','Name a reason someone might be late for work.','اذكر سببًا قد يجعل شخصًا يتأخر عن العمل.',[
    ['Traffic','ازدحام',35,['traffic jam'],['زحمة']],['Overslept','النوم الزائد',26,['slept in'],['تأخر بالنوم','نمت زيادة']],['Car problem','عطل في السيارة',15,['car trouble'],['مشكلة سيارة']],['Weather','الطقس',9,['bad weather'],['الجو']],['Missed alarm','لم يسمع المنبه',8,['alarm'],['المنبه']],['Family issue','ظرف عائلي',7,['family'],['أمر عائلي']]
  ]),
  q('food_breakfast_017','food','Name a popular breakfast food.','اذكر طعامًا شائعًا على الإفطار.',[
    ['Eggs','بيض',29,[],[]],['Bread','خبز',23,['toast'],['توست']],['Cereal','حبوب الإفطار',16,[],['كورن فليكس']],['Cheese','جبن',13,[],['جبنة']],['Fruit','فاكهة',11,['fruits'],['فواكه']],['Yogurt','زبادي',8,['yoghurt'],['روب']]
  ]),
  q('home_cleaning_018','home','Name something used to clean a house.','اذكر شيئًا يُستخدم لتنظيف المنزل.',[
    ['Vacuum','مكنسة كهربائية',30,['vacuum cleaner'],['مكنسة']],['Mop','ممسحة',20,[],[]],['Broom','مكنسة',17,[],[]],['Detergent','منظف',14,['cleaner'],['صابون تنظيف']],['Cloth','قطعة قماش',11,['rag'],['فوطة']],['Bucket','دلو',8,[],['سطل']]
  ]),
  q('school_exam_019','school','Name something students do before an exam.','اذكر شيئًا يفعله الطلاب قبل الاختبار.',[
    ['Study','المذاكرة',40,['revise','revision'],['أدرس','مراجعة']],['Sleep early','النوم مبكرًا',18,['sleep'],['أنام بدري']],['Drink coffee','شرب القهوة',13,['coffee'],['قهوة']],['Prepare pens','تجهيز الأقلام',11,['pens'],['قلم']],['Pray','الدعاء',10,['prayer'],['أدعي','صلاة']],['Check notes','مراجعة الملاحظات',8,['notes'],['ملخصات']]
  ]),
  q('work_office_020','work','Name something you might find on an office desk.','اذكر شيئًا قد تجده على مكتب العمل.',[
    ['Computer','كمبيوتر',33,['laptop','pc'],['حاسوب','لابتوب']],['Phone','هاتف',20,['mobile'],['جوال']],['Pen','قلم',17,[],[]],['Notebook','دفتر',13,['notepad'],['كراسة']],['Coffee','قهوة',10,['cup'],[]],['Charger','شاحن',7,[],[]]
  ]),
  q('tech_password_021','technology','Name something people use as part of a password.','اذكر شيئًا يستخدمه الناس كجزء من كلمة المرور.',[
    ['Numbers','أرقام',31,['number'],['رقم']],['Name','اسم',21,['names'],[]],['Birthday','تاريخ الميلاد',18,['birth date'],['ميلاد']],['Symbols','رموز',12,['special characters'],['رمز']],['Pet name','اسم حيوان أليف',10,['pet'],['اسم قطتي']],['Year','سنة',8,[],['عام']]
  ]),
  q('family_celebration_022','family','Name something families do at a birthday party.','اذكر شيئًا تفعله العائلات في حفلة عيد ميلاد.',[
    ['Cut cake','تقطيع الكعكة',29,['cake'],['كيك']],['Sing','الغناء',23,['birthday song'],['يغنون']],['Give gifts','تقديم الهدايا',19,['gifts','presents'],['هدايا']],['Take photos','التصوير',13,['photos'],['صور']],['Eat','الأكل',10,['food'],['طعام']],['Play games','لعب الألعاب',6,['games'],['ألعاب']]
  ]),
  q('friends_trip_023','friends','Name something friends argue about on a road trip.','اذكر شيئًا قد يختلف عليه الأصدقاء في رحلة بالسيارة.',[
    ['Music','الموسيقى',28,['songs'],['أغاني']],['Directions','الطريق',24,['route','navigation'],['الاتجاهات','المسار']],['Where to eat','مكان الأكل',18,['food','restaurant'],['مطعم']],['Driving','القيادة',13,['driver'],['السواقة']],['Temperature','حرارة المكيف',10,['ac','air conditioning'],['المكيف']],['Stops','أماكن التوقف',7,['breaks'],['توقف']]
  ]),
  q('sports_gym_024','sports','Name something people take to the gym.','اذكر شيئًا يأخذه الناس إلى النادي الرياضي.',[
    ['Water bottle','قنينة ماء',31,['water'],['ماء']],['Towel','منشفة',24,[],['فوطة']],['Headphones','سماعات',17,['earphones'],['سماعة']],['Gym shoes','حذاء رياضي',12,['shoes','trainers'],['جزمة رياضية']],['Phone','هاتف',9,['mobile'],['جوال']],['Protein shake','مشروب بروتين',7,['protein'],['بروتين']]
  ]),
  q('entertainment_streaming_025','entertainment','Name something people watch on a streaming service.','اذكر شيئًا يشاهده الناس على خدمات البث.',[
    ['Movies','أفلام',35,['movie','films'],['فيلم']],['TV series','مسلسلات',31,['series','shows'],['مسلسل']],['Documentaries','أفلام وثائقية',12,['documentary'],['وثائقي']],['Sports','رياضة',9,['sport'],['مباريات']],['Cartoons','رسوم متحركة',8,['animation'],['كرتون']],['Stand-up comedy','ستاند أب كوميدي',5,['comedy'],['كوميديا']]
  ]),
  q('shopping_online_026','shopping','Name something people check before buying online.','اذكر شيئًا يتحقق منه الناس قبل الشراء عبر الإنترنت.',[
    ['Price','السعر',29,['cost'],['سعر']],['Reviews','التقييمات',25,['ratings','customer reviews'],['مراجعات']],['Shipping','الشحن',17,['delivery'],['توصيل']],['Size','المقاس',12,[],['حجم']],['Return policy','سياسة الإرجاع',10,['returns'],['استرجاع']],['Seller','البائع',7,['store'],['المتجر']]
  ]),
  q('holiday_eid_027','holidays','Name something people often do during Eid.','اذكر شيئًا يفعله الناس غالبًا خلال العيد.',[
    ['Visit family','زيارة العائلة',32,['visit relatives'],['زيارة الأهل','الأقارب']],['Give gifts','تقديم الهدايا',20,['gifts'],['هدايا']],['Eat sweets','أكل الحلويات',18,['sweets'],['حلويات']],['Wear new clothes','لبس ملابس جديدة',13,['new clothes'],['ثوب جديد']],['Pray','الصلاة',10,['eid prayer'],['صلاة العيد']],['Travel','السفر',7,['trip'],['رحلة']]
  ]),
  q('cars_trunk_028','cars','Name something people keep in a car trunk.','اذكر شيئًا يحتفظ به الناس في صندوق السيارة.',[
    ['Spare tire','إطار احتياطي',30,['spare wheel'],['سبير','تاير احتياطي']],['Tools','أدوات',22,['tool kit'],['عدة']],['Water','ماء',16,[],['موية']],['Shopping bags','أكياس تسوق',13,['bags'],['أكياس']],['Jumper cables','أسلاك اشتراك',11,['jump leads'],['اشتراك بطارية']],['First aid kit','حقيبة إسعافات',8,['first aid'],['إسعافات أولية']]
  ]),
  q('animals_zoo_029','animals','Name an animal people expect to see at a zoo.','اذكر حيوانًا يتوقع الناس رؤيته في حديقة الحيوان.',[
    ['Lion','أسد',29,[],[]],['Elephant','فيل',23,[],[]],['Giraffe','زرافة',18,[],[]],['Monkey','قرد',14,['ape'],[]],['Tiger','نمر',10,[],[]],['Zebra','حمار وحشي',6,[],[]]
  ]),
  q('gulf_weather_030','gulf','Name something people do to cope with Gulf summer heat.','اذكر شيئًا يفعله الناس للتعامل مع حر الصيف في الخليج.',[
    ['Use air conditioning','تشغيل المكيف',36,['ac','air conditioner'],['مكيف','التكييف']],['Drink water','شرب الماء',24,['water'],['موية']],['Stay indoors','البقاء داخل المنزل',18,['stay inside'],['الجلوس بالبيت']],['Wear light clothes','لبس ملابس خفيفة',9,['light clothing'],['ملابس خفيفة']],['Go to mall','الذهاب إلى المول',8,['mall'],['مجمع']],['Swim','السباحة',5,['pool'],['مسبح']]
  ]),
  q('daily_keys_031','daily','Name a place people commonly lose their keys.','اذكر مكانًا يضيّع فيه الناس مفاتيحهم غالبًا.',[
    ['Sofa','الأريكة',27,['couch'],['كنبة']],['Bag','الحقيبة',22,['purse','handbag'],['شنطة']],['Car','السيارة',18,[],[]],['Pocket','الجيب',15,[],[]],['Bedroom','غرفة النوم',10,['bed'],['السرير']],['Office','المكتب',8,['desk'],[]]
  ]),
  q('food_pizza_032','food','Name a popular pizza topping.','اذكر إضافة شائعة على البيتزا.',[
    ['Cheese','جبن',30,['extra cheese'],['جبنة']],['Pepperoni','بيبروني',25,[],[]],['Mushrooms','فطر',16,['mushroom'],['مشروم']],['Olives','زيتون',12,['olive'],[]],['Chicken','دجاج',10,[],[]],['Peppers','فلفل',7,['bell peppers'],['فلفل رومي']]
  ]),
  q('home_kitchen_033','home','Name something found in almost every kitchen.','اذكر شيئًا يوجد تقريبًا في كل مطبخ.',[
    ['Refrigerator','ثلاجة',27,['fridge'],[]],['Stove','موقد',22,['cooker','oven'],['فرن']],['Sink','حوض',17,[],['مغسلة']],['Knife','سكين',14,[],[]],['Plates','صحون',11,['plate'],['صحن']],['Kettle','غلاية',9,[],[]]
  ]),
  q('school_class_034','school','Name something a teacher writes on the board.','اذكر شيئًا يكتبه المعلم على السبورة.',[
    ['Lesson title','عنوان الدرس',28,['title'],['العنوان']],['Notes','ملاحظات',24,['note'],['ملاحظة']],['Homework','واجب',18,['assignment'],['الواجب']],['Examples','أمثلة',13,['example'],['مثال']],['Date','التاريخ',10,[],[]],['Formula','معادلة',7,['equation'],['قانون']]
  ]),
  q('work_email_035','work','Name a reason someone sends an email at work.','اذكر سببًا لإرسال بريد إلكتروني في العمل.',[
    ['Request information','طلب معلومات',28,['ask a question'],['استفسار']],['Send files','إرسال ملفات',22,['attachment','documents'],['مرفقات']],['Schedule meeting','تحديد اجتماع',18,['meeting'],['موعد']],['Update status','تحديث العمل',13,['update'],['تحديث']],['Approval','طلب موافقة',11,['approve'],['موافقة']],['Reminder','تذكير',8,[],[]]
  ]),
  q('tech_laptop_036','technology','Name something that makes a laptop battery drain quickly.','اذكر شيئًا يجعل بطارية اللابتوب تنفد بسرعة.',[
    ['High brightness','سطوع الشاشة العالي',26,['brightness','bright screen'],['السطوع']],['Gaming','الألعاب',23,['games'],['لعب']],['Video streaming','مشاهدة الفيديو',19,['video'],['فيديو']],['Many apps','برامج كثيرة مفتوحة',14,['apps','programs'],['تطبيقات']],['Wi-Fi/Bluetooth','واي فاي أو بلوتوث',10,['wifi','bluetooth'],['واي فاي','بلوتوث']],['Old battery','بطارية قديمة',8,['bad battery'],['البطارية قديمة']]
  ]),
  q('family_dinner_037','family','Name a topic families discuss at dinner.','اذكر موضوعًا تتحدث عنه العائلات أثناء العشاء.',[
    ['Work','العمل',24,['job'],['الدوام']],['School','الدراسة',22,['school day'],['المدرسة']],['Plans','الخطط',18,['weekend plans'],['خطة']],['News','الأخبار',14,[],[]],['Family','العائلة',12,['relatives'],['الأقارب']],['Money','المال',10,['finances'],['فلوس']]
  ]),
  q('friends_party_038','friends','Name something people do at a party with friends.','اذكر شيئًا يفعله الناس في حفلة مع الأصدقاء.',[
    ['Talk','التحدث',25,['chat'],['سوالف','دردشة']],['Dance','الرقص',22,[],[]],['Eat','الأكل',19,['food'],['طعام']],['Take photos','التصوير',14,['photos'],['صور']],['Play games','لعب ألعاب',12,['games'],['ألعاب']],['Listen to music','سماع الموسيقى',8,['music'],['أغاني']]
  ]),
  q('sports_fan_039','sports','Name something a sports fan wears to support a team.','اذكر شيئًا يرتديه مشجع لدعم فريقه.',[
    ['Jersey','قميص الفريق',36,['shirt','kit'],['فانيلة']],['Scarf','وشاح',20,[],['شال']],['Hat','قبعة',16,['cap'],['كاب']],['Team colors','ألوان الفريق',12,['colors'],['لون الفريق']],['Face paint','رسم على الوجه',9,['paint'],['صبغ الوجه']],['Flag','علم',7,[],[]]
  ]),
  q('entertainment_game_040','entertainment','Name something players often do before starting a video game.','اذكر شيئًا يفعله اللاعبون غالبًا قبل بدء لعبة فيديو.',[
    ['Choose character','اختيار الشخصية',25,['character'],['شخصية']],['Adjust settings','ضبط الإعدادات',21,['settings'],['إعدادات']],['Invite friends','دعوة الأصدقاء',18,['friends'],['أصدقاء']],['Put on headset','لبس السماعة',14,['headset','headphones'],['سماعات']],['Get snacks','إحضار سناك',12,['snacks'],['أكل']],['Charge controller','شحن يد التحكم',10,['controller'],['شحن الكنترول']]
  ]),
  q('shopping_clothes_041','shopping','Name something people check when trying on clothes.','اذكر شيئًا يتحقق منه الناس عند تجربة الملابس.',[
    ['Fit','المقاس والملاءمة',33,['size','fits'],['المقاس']],['Mirror','المرآة',22,['look'],['المراية']],['Comfort','الراحة',16,[],[]],['Color','اللون',12,[],[]],['Price','السعر',10,['cost'],[]],['Length','الطول',7,[],[]]
  ]),
  q('holiday_hotel_042','holidays','Name something people ask a hotel receptionist.','اذكر شيئًا يسأل عنه الناس موظف استقبال الفندق.',[
    ['Wi-Fi password','كلمة مرور الواي فاي',26,['wifi'],['باسورد الواي فاي']],['Room location','مكان الغرفة',22,['room'],['الغرفة']],['Breakfast time','وقت الإفطار',18,['breakfast'],['الفطور']],['Checkout time','وقت تسجيل الخروج',14,['checkout'],['الخروج']],['Taxi','تاكسي',11,['cab'],['سيارة أجرة']],['Attractions','أماكن سياحية',9,['places to visit'],['أماكن']]
  ]),
  q('cars_wash_043','cars','Name something people clean when washing a car.','اذكر شيئًا ينظفه الناس عند غسل السيارة.',[
    ['Windows','النوافذ',25,['windshield','glass'],['الزجاج']],['Wheels','العجلات',22,['tires','rims'],['الكفرات','الجنوط']],['Seats','المقاعد',18,['seat'],['الكراسي']],['Dashboard','الطبلون',14,[],['لوحة العدادات']],['Mats','الدواسات',12,['floor mats'],['فرش الأرضية']],['Mirrors','المرايا',9,['mirror'],['المراية']]
  ]),
  q('animals_bird_044','animals','Name something a bird does.','اذكر شيئًا يفعله الطائر.',[
    ['Fly','يطير',38,['flying'],['طيران']],['Sing','يغرد',22,['chirp'],['تغريد']],['Eat seeds','يأكل الحبوب',14,['eat'],['يأكل']],['Build nest','يبني عشًا',11,['nest'],['عش']],['Lay eggs','يبيض',9,['eggs'],['بيض']],['Hop','يقفز',6,['jump'],['نط']]
  ]),
  q('gulf_ramadan_045','gulf','Name something commonly associated with Ramadan evenings.','اذكر شيئًا يرتبط عادةً بأمسيات رمضان.',[
    ['Iftar','الإفطار',29,['iftar meal'],['فطور']],['Family gathering','تجمع العائلة',22,['family'],['لمة']],['Prayer','الصلاة',18,['taraweeh'],['تراويح']],['Sweets','حلويات',13,['dessert'],['حلا']],['Coffee/tea','قهوة أو شاي',10,['coffee','tea'],['قهوة','شاي']],['TV shows','مسلسلات',8,['series'],['مسلسل']]
  ]),
  q('daily_phone_lost_046','daily','Name the first thing someone does after realizing their phone is missing.','اذكر أول شيء يفعله الشخص عندما يكتشف أن هاتفه مفقود.',[
    ['Call it','الاتصال بالهاتف',31,['ring it','call phone'],['أدق عليه']],['Search pockets','تفتيش الجيوب',22,['check pockets'],['أدور بالجيب']],['Look around','البحث حوله',18,['search'],['أبحث']],['Use find my phone','استخدام خدمة العثور على الهاتف',13,['find my iphone','find device'],['تحديد موقع الهاتف']],['Ask someone','سؤال شخص آخر',9,['ask'],['أسأل']],['Check car','تفقد السيارة',7,['car'],['السيارة']]
  ]),
  q('food_restaurant_047','food','Name something a waiter brings to the table.','اذكر شيئًا يحضره النادل إلى الطاولة.',[
    ['Menu','قائمة الطعام',29,['menus'],['المنيو']],['Water','ماء',23,[],['موية']],['Food','الطعام',20,['meal'],['أكل']],['Cutlery','أدوات المائدة',12,['fork','knife','spoon'],['ملعقة','شوكة']],['Bill','الحساب',9,['check'],['الفاتورة']],['Napkins','مناديل',7,['napkin'],['منديل']]
  ]),
  q('home_bedroom_048','home','Name something people keep beside their bed.','اذكر شيئًا يحتفظ به الناس بجانب السرير.',[
    ['Phone','هاتف',31,['mobile'],['جوال']],['Lamp','مصباح',21,['light'],['لمبة']],['Water','ماء',16,[],['موية']],['Alarm clock','منبه',13,['alarm'],['ساعة منبه']],['Book','كتاب',11,[],[]],['Charger','شاحن',8,[],[]]
  ]),
  q('school_break_049','school','Name something students do during a school break.','اذكر شيئًا يفعله الطلاب أثناء الفسحة المدرسية.',[
    ['Eat','الأكل',28,['snack','lunch'],['سناك']],['Talk with friends','التحدث مع الأصدقاء',25,['chat'],['سوالف']],['Play','اللعب',18,['games'],['ألعاب']],['Use phone','استخدام الهاتف',12,['phone'],['جوال']],['Go outside','الخروج للساحة',10,['outside'],['الساحة']],['Study','المذاكرة',7,['revise'],['أدرس']]
  ]),
  q('work_break_050','work','Name something people do during a short break at work.','اذكر شيئًا يفعله الناس خلال استراحة قصيرة في العمل.',[
    ['Drink coffee','شرب القهوة',28,['coffee'],['قهوة']],['Check phone','تفقد الهاتف',23,['phone'],['جوال']],['Talk to coworkers','التحدث مع الزملاء',18,['chat'],['سوالف']],['Eat snack','أكل سناك',13,['snack'],['أكل']],['Walk','المشي',10,['take a walk'],['أتمشى']],['Smoke','التدخين',8,['cigarette'],['دخان']]
  ]),
  q('tech_video_call_051','technology','Name a problem people experience during a video call.','اذكر مشكلة يواجهها الناس أثناء مكالمة فيديو.',[
    ['Bad internet','ضعف الإنترنت',35,['slow internet','connection'],['نت ضعيف']],['No sound','لا يوجد صوت',20,['audio issue'],['الصوت']],['Frozen video','تجمّد الصورة',17,['freeze'],['الصورة معلقة']],['Echo','صدى الصوت',11,[],[]],['Camera off','الكاميرا لا تعمل',10,['camera'],['كاميرا']],['Background noise','ضوضاء الخلفية',7,['noise'],['إزعاج']]
  ]),
  q('family_photo_052','family','Name an occasion when families take many photos.','اذكر مناسبة تلتقط فيها العائلات صورًا كثيرة.',[
    ['Wedding','زفاف',30,['weddings'],['عرس']],['Birthday','عيد ميلاد',22,[],[]],['Eid','العيد',17,[],[]],['Vacation','إجازة',13,['holiday','trip'],['سفر']],['Graduation','تخرج',11,[],[]],['New baby','مولود جديد',7,['baby'],['بيبي']]
  ]),
  q('friends_gift_053','friends','Name a gift people commonly give a friend.','اذكر هدية شائعة يقدمها الناس لصديق.',[
    ['Perfume','عطر',24,[],[]],['Gift card','بطاقة هدية',21,['voucher'],['قسيمة']],['Clothes','ملابس',18,['shirt'],['لبس']],['Chocolate','شوكولاتة',15,['chocolates'],['شوكولاته']],['Flowers','ورود',12,['flower'],['ورد']],['Book','كتاب',10,[],[]]
  ]),
  q('sports_pool_054','sports','Name something people take to a swimming pool.','اذكر شيئًا يأخذه الناس إلى المسبح.',[
    ['Swimsuit','ملابس سباحة',30,['swimming suit'],['مايوه']],['Towel','منشفة',25,[],['فوطة']],['Goggles','نظارات سباحة',16,['swim goggles'],['نظارة سباحة']],['Water','ماء',12,[],['موية']],['Flip-flops','شبشب',10,['sandals'],['نعال']],['Sunscreen','واقي شمس',7,['sunblock'],['كريم شمس']]
  ]),
  q('entertainment_concert_055','entertainment','Name something people do at a concert.','اذكر شيئًا يفعله الناس في حفل موسيقي.',[
    ['Sing','الغناء',26,['sing along'],['يغني']],['Record video','تصوير فيديو',23,['video','record'],['تصوير']],['Dance','الرقص',19,[],[]],['Cheer','التشجيع',13,['shout'],['هتاف']],['Take photos','التقاط الصور',11,['photos'],['صور']],['Buy merchandise','شراء تذكارات',8,['merch'],['شراء منتجات']]
  ]),
  q('shopping_mall_056','shopping','Name something people do at a shopping mall besides shopping.','اذكر شيئًا يفعله الناس في المجمع التجاري غير التسوق.',[
    ['Eat','الأكل',30,['restaurant','food'],['مطعم']],['Watch movie','مشاهدة فيلم',22,['cinema','movie'],['سينما']],['Meet friends','مقابلة الأصدقاء',18,['friends'],['أصدقاء']],['Drink coffee','شرب القهوة',13,['coffee'],['كافيه']],['Walk','المشي',10,['walk around'],['تمشية']],['Play games','لعب الألعاب',7,['arcade','games'],['ألعاب']]
  ]),
  q('holiday_airport_057','holidays','Name something people do while waiting at an airport.','اذكر شيئًا يفعله الناس أثناء الانتظار في المطار.',[
    ['Use phone','استخدام الهاتف',27,['phone'],['جوال']],['Eat','الأكل',21,['food'],['مطعم']],['Shop','التسوق',17,['shopping','duty free'],['سوق حرة']],['Sleep','النوم',14,['nap'],['أنام']],['Watch screens','متابعة الشاشات',12,['flight screen'],['شاشة الرحلات']],['Read','القراءة',9,['book'],['كتاب']]
  ]),
  q('cars_petrol_058','cars','Name something people do at a petrol station.','اذكر شيئًا يفعله الناس في محطة الوقود.',[
    ['Fill fuel','تعبئة الوقود',46,['gas','petrol','fuel'],['بنزين','تعبئة البنزين']],['Buy snacks','شراء سناك',17,['snacks','food'],['أكل']],['Wash car','غسل السيارة',14,['car wash'],['غسيل السيارة']],['Check tires','فحص الإطارات',9,['tires'],['الكفرات']],['Use restroom','دخول الحمام',8,['bathroom'],['الحمام']],['Buy water','شراء ماء',6,['water'],['موية']]
  ]),
  q('animals_dog_059','animals','Name something a dog likes to do.','اذكر شيئًا يحب الكلب فعله.',[
    ['Play','اللعب',29,['playing'],['يلعب']],['Eat','الأكل',24,['food'],['يأكل']],['Walk','المشي',18,['go for walk'],['يتمشى']],['Sleep','النوم',13,[],['ينام']],['Fetch','إحضار الكرة',9,['fetch ball'],['كرة']],['Bark','النباح',7,['barking'],['ينبح']]
  ]),
  q('gulf_weekend_060','gulf','Name a place people in the Gulf often visit on a weekend.','اذكر مكانًا يزوره الناس في الخليج غالبًا في عطلة نهاية الأسبوع.',[
    ['Mall','مجمع تجاري',29,['shopping mall'],['مول']],['Restaurant','مطعم',24,[],[]],['Chalet','شاليه',17,['beach house'],['استراحة']],['Beach','شاطئ',12,[],['بحر']],['Family home','بيت العائلة',10,['relatives house'],['بيت الأهل']],['Cafe','مقهى',8,['coffee shop'],['كافيه','كوفي']]
  ])
];

export function validateQuestionBank(questions) {
  const errors = [];
  const ids = new Set();
  questions.forEach((question, qi) => {
    const path = `Question #${qi + 1}`;
    if (!question || typeof question !== 'object') return errors.push(`${path}: invalid object.`);
    if (!question.id || typeof question.id !== 'string') errors.push(`${path}: missing string id.`);
    else if (ids.has(question.id)) errors.push(`${path}: duplicate id "${question.id}".`);
    else ids.add(question.id);
    if (!question.category || typeof question.category !== 'string') errors.push(`${path}: missing category.`);
    for (const lang of ['en', 'ar']) {
      if (!question.question?.[lang]?.trim()) errors.push(`${path}: missing ${lang} question text.`);
    }
    if (!Array.isArray(question.answers) || question.answers.length < 3 || question.answers.length > 8) {
      errors.push(`${path}: answers must contain 3-8 items.`);
      return;
    }
    const answerIds = new Set();
    question.answers.forEach((answer, ai) => {
      const ap = `${path} → Answer #${ai + 1}`;
      if (!answer.id || answerIds.has(answer.id)) errors.push(`${ap}: missing or duplicate answer id.`);
      answerIds.add(answer.id);
      if (!Number.isFinite(answer.points) || answer.points < 0) errors.push(`${ap}: points must be a non-negative number.`);
      for (const lang of ['en', 'ar']) {
        if (!answer.text?.[lang]?.trim()) errors.push(`${ap}: missing ${lang} answer text.`);
        if (!Array.isArray(answer.aliases?.[lang]) || answer.aliases[lang].some(v => typeof v !== 'string')) {
          errors.push(`${ap}: ${lang} aliases must be an array of strings.`);
        }
      }
    });
  });
  return errors;
}

export function cloneQuestions(questions = BUILTIN_QUESTIONS) {
  return JSON.parse(JSON.stringify(questions));
}

// Authored Mumbai recording script. Only `text` is sent to ElevenLabs.
// Hindi carries the meaning; familiar Marathi words supply the local flavour.
const line = (event, subtitle, text, meaning) => ({ event, subtitle, text, meaning });
const person = (id, age, gender, direction, lines) => ({ id, age, gender, direction, lines });

export const dialogue = [
  person("sachin", 32, "male", "Warm, relaxed Mumbai auto driver; quiet confidence and a small smile.", [
    line("ignition", "Chala, Mumbai! Aaram se chalenge, maza aayega.", "चला, मुंबई! आराम से चलेंगे, मज़ा आएगा।", "Let's go, Mumbai! An easy drive will be fun."),
    line("red_wait", "Signal laal hai, bhau. Thamba, abhi hara hoga.", "सिग्नल लाल है, भाऊ। थांबा, अभी हरा होगा।", "The signal is red, friend. Wait, it will turn green."),
    line("waterfront", "Samundar ki hawa mast hai! Isi mein toh Mumbai ka maza hai.", "समुंदर की हवा मस्त है! इसी में तो मुंबई का मज़ा है।", "What a sea breeze! This is the joy of Mumbai."),
    line("stand", "Apna adda aa gaya. Chala, ek cutting ho jaaye.", "अपना अड्डा आ गया। चला, एक कटिंग हो जाए।", "Back at our stand. Let's have a cutting chai."),
  ]),
  person("raju", 58, "male", "Affectionate older driver; weathered, unhurried, with dry humour.", [
    line("greet_intro", "Arre Sachin bhau! Aaj kidhar ki sawaari?", "अरे सचिन भाऊ! आज किधर की सवारी?", "Hey, Sachin! Where are you heading today?"),
    line("ambient", "Bhau, tula kya bolun? Cutting chai se din banta hai.", "भाऊ, तुला क्या बोलूँ? कटिंग चाय से दिन बनता है।", "What can I tell you, friend? Cutting chai makes the day."),
    line("ambient", "Itni chik-chik mat kar, bhau. Do minute aaram kar!", "इतनी चिक-चिक मत कर, भाऊ। दो मिनट आराम कर!", "Don't fuss so much, friend. Take a two-minute break!"),
    line("warning", "Arre bhau! Dekh ke chala, rasta tere baap ka hai kya?", "अरे भाऊ! देख के चला, रास्ता तेरे बाप का है क्या?", "Hey! Watch where you're driving. Do you own this road?"),
  ]),
  person("meera", 43, "female", "Warm, resonant chai-stall owner; brisk and inviting, never shrill.", [
    line("ambient", "Cutting chai, bhau? Garam hai, aaram se peena.", "कटिंग चाय, भाऊ? गरम है, आराम से पीना।", "Cutting chai, friend? It's hot, sip it slowly."),
    line("ambient", "Chala tai, chai tayyar! Adrak bhi mast daala hai.", "चला ताई, चाय तैयार! अदरक भी मस्त डाला है।", "Come along, sister, the chai is ready! Plenty of ginger too."),
    line("ambient", "Pehle chai, phir bhaag-daud. Mumbai ka yahi rule hai!", "पहले चाय, फिर भाग-दौड़। मुंबई का यही रूल है!", "Chai first, rushing around later. That's Mumbai's rule!"),
    line("warning", "Arre bhau, sambhal! Garam chai gir jaati abhi!", "अरे भाऊ, संभल! गरम चाय गिर जाती अभी!", "Careful! You nearly spilled the hot chai!"),
  ]),
  person("sameer", 28, "male", "Young mechanic; practical medium-low voice, clipped and reassuring.", [
    line("ambient", "Engine ki awaaz sun, bhau. Apna auto ekdum fit hai.", "इंजन की आवाज़ सुन, भाऊ। अपना ऑटो एकदम फिट है।", "Listen to that engine, friend. Our auto is in great shape."),
    line("ambient", "Chala, pehle tyre dekh le. Hawa sahi toh safar sahi.", "चला, पहले टायर देख ले। हवा सही तो सफ़र सही।", "Let's check the tyres first. Right pressure, smooth journey."),
    line("ambient", "Gaadi ko bhi aaram chahiye, bhau. Machine hai, jadugar nahi.", "गाड़ी को भी आराम चाहिए, भाऊ। मशीन है, जादूगर नहीं।", "Even a vehicle needs rest. It's a machine, not a magician."),
    line("warning", "Aye bhau! Dheere chala, yahaan kaam chal raha hai!", "ऐ भाऊ! धीरे चला, यहाँ काम चल रहा है!", "Slow down, friend! There's work going on here!"),
  ]),
  person("aarti", 27, "female", "Clear young commuter; focused, lightly hurried, conversational.", [
    line("ambient", "Bhau, train mil jaaye bas. Meeting mein late nahi hona.", "भाऊ, ट्रेन मिल जाए बस। मीटिंग में लेट नहीं होना।", "I just need to catch the train. Can't be late for the meeting."),
    line("ambient", "Thamba zara, bag ki chain khuli reh gayi!", "थांबा ज़रा, बैग की चेन खुली रह गई!", "Wait a moment, I left my bag unzipped!"),
    line("ambient", "Office se pehle cutting mil jaaye, toh din mast jaaye.", "ऑफ़िस से पहले कटिंग मिल जाए, तो दिन मस्त जाए।", "A cutting chai before work makes the day better."),
    line("warning", "Arre bhau! Dekh ke chala, office pahunchna hai mujhe!", "अरे भाऊ! देख के चला, ऑफ़िस पहुँचना है मुझे!", "Watch where you're driving! I need to reach my office!"),
  ]),
  person("imran", 21, "male", "Bright college student; easy banter and playful timing, no shouting.", [
    line("ambient", "Chala, chai peete hain. Class mein abhi time hai!", "चला, चाय पीते हैं। क्लास में अभी टाइम है!", "Let's have chai. There's still time before class!"),
    line("ambient", "Assignment kal dena hai, bhau. Aaj thoda Mumbai ghoomein?", "असाइनमेंट कल देना है, भाऊ। आज थोड़ा मुंबई घूमें?", "The assignment is due tomorrow. Shall we explore Mumbai today?"),
    line("ambient", "Kya mast hawa hai, yaar! Lecture ke baad idhar hi baithte hain.", "क्या मस्त हवा है, यार! लेक्चर के बाद इधर ही बैठते हैं।", "What a breeze! Let's sit here after the lecture."),
    line("warning", "Aye bhau! Brake bhi diya hai auto mein, use kar na!", "ऐ भाऊ! ब्रेक भी दिया है ऑटो में, यूज़ कर ना!", "Hey! The auto has brakes too. Use them!"),
  ]),
  person("lata", 55, "female", "Mature flower seller; earthy warmth and a gentle musical Marathi cadence.", [
    line("ambient", "Taaze phool le lo, tai! Mogra ekdum mast hai.", "ताज़े फूल ले लो, ताई! मोगरा एकदम मस्त है।", "Fresh flowers, sister! The jasmine is lovely."),
    line("ambient", "Chala bhau, ek gajra le jaao. Ghar mein khushboo ho jaayegi.", "चला भाऊ, एक गजरा ले जाओ। घर में ख़ुशबू हो जाएगी।", "Take a flower garland home, friend. It'll smell wonderful."),
    line("ambient", "Aaram se dekho, tai. Aaj ke phool abhi aaye hain.", "आराम से देखो, ताई। आज के फूल अभी आए हैं।", "Take your time, sister. Today's flowers just arrived."),
    line("warning", "Arre bhau! Phool hain, football nahi. Sambhal ke!", "अरे भाऊ! फूल हैं, फ़ुटबॉल नहीं। संभल के!", "Hey! These are flowers, not footballs. Be careful!"),
  ]),
  person("patil", 45, "male", "Male traffic constable; grounded, firm diction and controlled authority.", [
    line("ambient", "Bhau, signal ka dhyaan rakho. Sabko ghar jaana hai.", "भाऊ, सिग्नल का ध्यान रखो। सबको घर जाना है।", "Mind the signals, friend. Everyone needs to get home."),
    line("ambient", "Chala, line mein raho. Raasta sabka hai.", "चला, लाइन में रहो। रास्ता सबका है।", "Keep in line. The road belongs to everyone."),
    line("ambient", "Crossing khaali rakhna, bhau. Logon ko jagah chahiye.", "क्रॉसिंग खाली रखना, भाऊ। लोगों को जगह चाहिए।", "Keep the crossing clear. People need room to pass."),
    line("warning", "Bhau, gaadi sambhalo! Log chal rahe hain yahaan!", "भाऊ, गाड़ी संभालो! लोग चल रहे हैं यहाँ!", "Control your vehicle! People are walking here!"),
  ]),
  person("nilesh", 38, "male", "Dabbawala; brisk, light and efficient, with friendly short calls.", [
    line("ambient", "Dabbe tayyar, bhau! Chala, time pe pahunchana hai.", "डब्बे तैयार, भाऊ! चला, टाइम पे पहुँचाना है।", "The tiffins are ready! Let's deliver them on time."),
    line("ambient", "Bhau, zara jagah dena. Kisi ka garam khaana jaa raha hai.", "भाऊ, ज़रा जगह देना। किसी का गरम खाना जा रहा है।", "A little room, friend. Someone's hot lunch is coming through."),
    line("ambient", "Apna dabba sahi jagah jaata hai. Mumbai ka bharosa hai, bhau.", "अपना डब्बा सही जगह जाता है। मुंबई का भरोसा है, भाऊ।", "Our tiffins reach the right place. Mumbai trusts us."),
    line("warning", "Arre bhau, dheere! Dabbe giraayega toh lunch kaun dega?", "अरे भाऊ, धीरे! डब्बे गिराएगा तो लंच कौन देगा?", "Slow down! If you drop these tiffins, who's bringing lunch?"),
  ]),
  person("farah", 36, "female", "Adult fruit seller; bright, steady market projection and easy Hindi.", [
    line("ambient", "Seb, kele, sab taaza hai! Dekh lo, bhau.", "सेब, केले, सब ताज़ा है! देख लो, भाऊ।", "Apples, bananas, all fresh! Have a look, friend."),
    line("ambient", "Tai, aaram se chuno. Meetha phal ghar le jaana.", "ताई, आराम से चुनो। मीठा फल घर ले जाना।", "Take your time choosing, sister. Bring something sweet home."),
    line("ambient", "Chala bhau, phal bhi khaaya karo. Sirf chai pe mat chalo!", "चला भाऊ, फल भी खाया करो। सिर्फ़ चाय पे मत चलो!", "Have some fruit too, friend. You can't run on chai alone!"),
    line("warning", "Aye bhau! Thela dikh nahi raha? Zara sambhal ke!", "ऐ भाऊ! ठेला दिख नहीं रहा? ज़रा संभल के!", "Can't you see the cart? Be careful!"),
  ]),
  person("suresh", 61, "male", "Older newspaper seller; lightly textured voice, short rhythmic calls.", [
    line("ambient", "Aaj ka akhbaar, bhau! Taazi khabar padh lo.", "आज का अख़बार, भाऊ! ताज़ी ख़बर पढ़ लो।", "Today's paper! Read the latest news."),
    line("ambient", "Chai ke saath paper ho, toh subah mast ho jaaye.", "चाय के साथ पेपर हो, तो सुबह मस्त हो जाए।", "A newspaper with chai makes a lovely morning."),
    line("ambient", "Thamba bhau, chhutte de deta hoon. Paper hawa mein ud raha hai!", "थांबा भाऊ, छुट्टे दे देता हूँ। पेपर हवा में उड़ रहा है!", "Wait, I'll get your change. The paper is flying in this wind!"),
    line("warning", "Arre bhau! Khabar padhni hai, khabar banna nahi hai!", "अरे भाऊ! ख़बर पढ़नी है, ख़बर बनना नहीं है!", "I want to read the news, not become the news!"),
  ]),
  person("pooja", 26, "female", "Young nurse after a shift; soft, clear, practical and slightly tired.", [
    line("ambient", "Shift khatam, bhau. Ab ghar ki chai chahiye bas.", "शिफ़्ट ख़त्म, भाऊ। अब घर की चाय चाहिए बस।", "Shift's over. All I want is chai at home."),
    line("ambient", "Thamba zara. Pehle aaram se road paar kar lete hain.", "थांबा ज़रा। पहले आराम से रोड पार कर लेते हैं।", "Wait a moment. Let's cross the road carefully first."),
    line("ambient", "Aaj hawa mast hai. Do minute baithun, phir nikalti hoon.", "आज हवा मस्त है। दो मिनट बैठूँ, फिर निकलती हूँ।", "Lovely breeze today. I'll sit for two minutes before heading off."),
    line("warning", "Bhau, sambhal ke! Hospital se aayi hoon, wapas mat bhejo!", "भाऊ, संभल के! हॉस्पिटल से आई हूँ, वापस मत भेजो!", "Careful! I just left the hospital, don't send me back!"),
  ]),
  person("vikram", 35, "male", "Office commuter; contained mid-register voice, mild urgency and dry humour.", [
    line("ambient", "Meeting se pehle chai mil jaaye, bhau. Phir sab set hai.", "मीटिंग से पहले चाय मिल जाए, भाऊ। फिर सब सेट है।", "A chai before the meeting and I'm all set."),
    line("ambient", "Haan, nikal gaya hoon. Mumbai ka traffic hai, thoda thamba!", "हाँ, निकल गया हूँ। मुंबई का ट्रैफ़िक है, थोड़ा थांबा!", "Yes, I've left. It's Mumbai traffic, give me a moment!"),
    line("ambient", "Chala, aaj time pe ghar. Laptop bhi aaram karega.", "चला, आज टाइम पे घर। लैपटॉप भी आराम करेगा।", "Let's get home on time today. Even the laptop needs a rest."),
    line("warning", "Arre bhau! Laptop sambhalun ya khud ko? Dheere chala!", "अरे भाऊ! लैपटॉप संभालूँ या ख़ुद को? धीरे चला!", "Should I save my laptop or myself? Slow down!"),
  ]),
  person("zoya", 22, "female", "Young artist; airy, curious and quietly expressive.", [
    line("ambient", "Woh balcony dekho, bhau. Kitni mast design hai!", "वो बालकनी देखो, भाऊ। कितनी मस्त डिज़ाइन है!", "Look at that balcony. What a lovely design!"),
    line("ambient", "Thamba, bas do minute. Sketch ka last corner bacha hai.", "थांबा, बस दो मिनट। स्केच का लास्ट कॉर्नर बचा है।", "Wait, just two minutes. One corner of the sketch is left."),
    line("ambient", "Mumbai mein har gali ka apna rang hai. Maza aa gaya!", "मुंबई में हर गली का अपना रंग है। मज़ा आ गया!", "Every Mumbai lane has its own colour. I love it!"),
    line("warning", "Aye bhau! Sketch bana rahi hoon, stunt nahi. Dekh ke!", "ऐ भाऊ! स्केच बना रही हूँ, स्टंट नहीं। देख के!", "I'm making a sketch, not doing a stunt. Watch out!"),
  ]),
  person("bala", 25, "male", "Delivery rider; energetic, quick and natural, with clear short phrases.", [
    line("ambient", "Bhau, yahi building hai na? Address toh idhar ka hai.", "भाऊ, यही बिल्डिंग है ना? एड्रेस तो इधर का है।", "This is the building, right? The address says here."),
    line("ambient", "Parcel aa gaya! Chala, neeche aa jaao.", "पार्सल आ गया! चला, नीचे आ जाओ।", "Your parcel is here! Come downstairs."),
    line("ambient", "Ek delivery aur, phir cutting. Mast plan hai, bhau!", "एक डिलीवरी और, फिर कटिंग। मस्त प्लान है, भाऊ!", "One more delivery, then chai. Great plan!"),
    line("warning", "Bhau, dekh ke! Parcel naazuk hai, main bhi hoon!", "भाऊ, देख के! पार्सल नाज़ुक है, मैं भी हूँ!", "Watch out! The parcel is fragile, and so am I!"),
  ]),
  person("jyoti", 41, "female", "Safai saathi; low-mid voice, matter-of-fact warmth and deliberate speech.", [
    line("ambient", "Zara side, bhau. Safai ho jaaye toh sabko achha lagega.", "ज़रा साइड, भाऊ। सफ़ाई हो जाए तो सबको अच्छा लगेगा।", "A little room, friend. Everyone likes a clean street."),
    line("ambient", "Chala, yeh kona bhi saaf. Ab gali mast lag rahi hai.", "चला, ये कोना भी साफ़। अब गली मस्त लग रही है।", "There, this corner is clean too. The lane looks lovely now."),
    line("ambient", "Kachra dabbe mein, bhau. Mumbai apna ghar hai.", "कचरा डब्बे में, भाऊ। मुंबई अपना घर है।", "Rubbish in the bin, friend. Mumbai is our home."),
    line("warning", "Arre bhau! Jhaadu dikh raha hai na? Zara jagah de!", "अरे भाऊ! झाड़ू दिख रहा है ना? ज़रा जगह दे!", "You can see the broom, right? Give me a little room!"),
  ]),
  person("shanta", 70, "female", "Older local grandmother; warm, measured and gently amused, never a frail parody.", [
    line("ambient", "Aaramat, beta. Mumbai kahin bhaagi nahi jaa rahi.", "आरामात, बेटा। मुंबई कहीं भागी नहीं जा रही।", "Take it easy, dear. Mumbai isn't going anywhere."),
    line("ambient", "Hawa mast hai aaj. Chala, thodi der baithte hain.", "हवा मस्त है आज। चला, थोड़ी देर बैठते हैं।", "Lovely breeze today. Let's sit for a while."),
    line("ambient", "Bhau, bachpan se yahi gali dekhi hai. Har din nayi lagti hai.", "भाऊ, बचपन से यही गली देखी है। हर दिन नई लगती है।", "I've known this lane since childhood. It feels new every day."),
    line("warning", "Arre bhau, aaram se! Aaji ko bhi ghar pahunchna hai.", "अरे भाऊ, आराम से! आजी को भी घर पहुँचना है।", "Easy there! Grandma needs to get home too."),
  ]),
  person("dev", 30, "male", "Polite photographer; light voice, clear Hindi and quiet curiosity.", [
    line("ambient", "Ek photo aur, bhau. Yeh building mast aa rahi hai!", "एक फ़ोटो और, भाऊ। ये बिल्डिंग मस्त आ रही है!", "One more photo. This building looks wonderful in the shot!"),
    line("ambient", "Samundar ki taraf yahi raasta hai na, bhau?", "समुंदर की तरफ़ यही रास्ता है ना, भाऊ?", "This is the way towards the sea, right?"),
    line("ambient", "Chala, roshni badalne se pehle ek aur photo lete hain.", "चला, रोशनी बदलने से पहले एक और फ़ोटो लेते हैं।", "Let's take one more photo before the light changes."),
    line("warning", "Arre bhau! Camera bacha, par tu zara brake maar!", "अरे भाऊ! कैमरा बचा, पर तू ज़रा ब्रेक मार!", "My camera survived, but please hit the brakes!"),
  ]),
  person("asha", 29, "female", "Upbeat jogger; clear, energetic short phrases, lightly breathy without panting.", [
    line("ambient", "Bas ek chakkar aur. Phir mast cutting chai!", "बस एक चक्कर और। फिर मस्त कटिंग चाय!", "One more jogging loop, then a lovely cutting chai!"),
    line("ambient", "Thamba, paani pee loon. Aaj dhoop tez hai, bhau.", "थांबा, पानी पी लूँ। आज धूप तेज़ है, भाऊ।", "Wait, let me drink some water. It's sunny today."),
    line("ambient", "Chala, aaram se jogging. Samundar ki hawa ka maza lo!", "चला, आराम से जॉगिंग। समुंदर की हवा का मज़ा लो!", "Let's jog at an easy pace. Enjoy the sea breeze!"),
    line("warning", "Aye bhau! Main jogging kar rahi hoon, race nahi laga rahi!", "ऐ भाऊ! मैं जॉगिंग कर रही हूँ, रेस नहीं लगा रही!", "I'm jogging, not racing your auto!"),
  ]),
  person("ganesh", 40, "male", "Adult shop worker; resonant, practical voice and short projected requests.", [
    line("ambient", "Maal aa gaya, bhau. Chala, yeh peti andar rakhte hain.", "माल आ गया, भाऊ। चला, ये पेटी अंदर रखते हैं।", "The stock is here. Let's carry this crate inside."),
    line("ambient", "Zara jagah dena, bhau. Peti bhaari hai, mazaak nahi!", "ज़रा जगह देना, भाऊ। पेटी भारी है, मज़ाक नहीं!", "A little room, friend. This crate is seriously heavy!"),
    line("ambient", "Kaam ho gaya. Ab do minute chai ka maza lete hain.", "काम हो गया। अब दो मिनट चाय का मज़ा लेते हैं।", "Work's done. Let's enjoy a two-minute chai break."),
    line("warning", "Arre bhau! Peti gira di toh saara maal sadak pe aayega!", "अरे भाऊ! पेटी गिरा दी तो सारा माल सड़क पे आएगा!", "If you knock this crate down, the stock will be all over the road!"),
  ]),
];

// A reply is only paired with a nearby person discussing the same topic.
// These are conversations between locals, not announcements to the player.
const conversations = {
  raju: ["chai", ["Chala, ek cutting peete hain?", "चला, एक कटिंग पीते हैं?", "Shall we have a cutting chai?"], ["Haan, chai se hi din banta hai!", "हाँ, चाय से ही दिन बनता है!", "Yes, chai makes the day!"]],
  meera: ["chai", ["Chai loge? Abhi banayi hai.", "चाय लोगे? अभी बनाई है।", "Would you like chai? I just made it."], ["Chala, garam chai tayyar hai!", "चला, गरम चाय तैयार है!", "Come along, the hot chai is ready!"]],
  sameer: ["chai", ["Kaam ke baad ek chai ho jaaye?", "काम के बाद एक चाय हो जाए?", "How about chai after work?"], ["Haan, bas haath saaf kar loon.", "हाँ, बस हाथ साफ़ कर लूँ।", "Yes, just let me clean my hands."]],
  aarti: ["busy", ["Aaj bhi kitni bhaag-daud hai na?", "आज भी कितनी भाग-दौड़ है ना?", "Another busy day, isn't it?"], ["Haan, bas time pe pahunch jaayein!", "हाँ, बस टाइम पे पहुँच जाएँ!", "Yes, let's just get there on time!"]],
  imran: ["breeze", ["Aaj hawa mast hai na, yaar?", "आज हवा मस्त है ना, यार?", "Lovely breeze today, isn't it?"], ["Ekdum! Idhar baithne ka maza hi alag hai.", "एकदम! इधर बैठने का मज़ा ही अलग है।", "Absolutely! It's lovely sitting here."]],
  lata: ["chai", ["Thak gaye? Chala, chai peete hain.", "थक गए? चला, चाय पीते हैं।", "Tired? Let's have chai."], ["Haan, adrak wali ho toh mast!", "हाँ, अदरक वाली हो तो मस्त!", "Yes, ginger chai would be lovely!"]],
  patil: ["busy", ["Aaj road pe kaafi bheed hai na?", "आज रोड पे काफ़ी भीड़ है ना?", "The road is quite busy today, isn't it?"], ["Haan, aaram se chalo. Sab pahunch jaayenge.", "हाँ, आराम से चलो। सब पहुँच जाएँगे।", "Yes, take it easy. Everyone will get there."]],
  nilesh: ["chai", ["Dabbe rakh diye. Chala, chai piyein?", "डब्बे रख दिए। चला, चाय पिएँ?", "The tiffins are put away. Shall we have chai?"], ["Haan, ek cutting. Phir kaam pe!", "हाँ, एक कटिंग। फिर काम पे!", "Yes, one cutting chai, then back to work!"]],
  farah: ["chai", ["Chala, ek cutting mangwa lein?", "चला, एक कटिंग मँगवा लें?", "Shall we order a cutting chai?"], ["Haan, yeh tokri rakh doon pehle.", "हाँ, ये टोकरी रख दूँ पहले।", "Yes, let me put this basket down first."]],
  suresh: ["busy", ["Mumbai ki bhaag-daud kabhi rukti hai kya?", "मुंबई की भाग-दौड़ कभी रुकती है क्या?", "Does Mumbai's rush ever stop?"], ["Haan, roz ki kahaani hai. Aaram se!", "हाँ, रोज़ की कहानी है। आराम से!", "Yes, it's the everyday story. Take it easy!"]],
  pooja: ["breeze", ["Aaj bahar ki hawa kitni mast hai na?", "आज बाहर की हवा कितनी मस्त है ना?", "The breeze outside is lovely today, isn't it?"], ["Haan, do minute mein thakaan utar gayi.", "हाँ, दो मिनट में थकान उतर गई।", "Yes, two minutes here and I feel refreshed."]],
  vikram: ["chai", ["Meeting se pehle ek cutting ho jaaye?", "मीटिंग से पहले एक कटिंग हो जाए?", "How about a cutting chai before the meeting?"], ["Haan, chai ke bina meeting kaise hogi!", "हाँ, चाय के बिना मीटिंग कैसे होगी!", "Yes, how can there be a meeting without chai!"]],
  zoya: ["breeze", ["Hawa mast hai. Yahin baithte hain na?", "हवा मस्त है। यहीं बैठते हैं ना?", "Lovely breeze. Shall we sit here?"], ["Haan, roshni bhi kitni sundar hai!", "हाँ, रोशनी भी कितनी सुंदर है!", "Yes, and the light is beautiful too!"]],
  bala: ["busy", ["Aaj traffic kuch zyada hai na?", "आज ट्रैफ़िक कुछ ज़्यादा है ना?", "There's more traffic than usual today, right?"], ["Haan, phir bhi aaram se hi chalna hai.", "हाँ, फिर भी आराम से ही चलना है।", "Yes, but we still have to take it easy."]],
  jyoti: ["busy", ["Itni bhaag-daud! Do minute aaram nahi milta na?", "इतनी भाग-दौड़! दो मिनट आराम नहीं मिलता ना?", "So much rushing around! Hard to find a break, isn't it?"], ["Haan, bas yeh kaam ho jaaye. Phir break.", "हाँ, बस ये काम हो जाए। फिर ब्रेक।", "Yes, once this job is done, then a break."]],
  shanta: ["breeze", ["Hawa achhi hai na? Chala, thoda baitho.", "हवा अच्छी है ना? चला, थोड़ा बैठो।", "Nice breeze, isn't it? Come, sit a while."], ["Haan beta, aise hi aaramat rehna chahiye.", "हाँ बेटा, ऐसे ही आरामात रहना चाहिए।", "Yes, dear, this is how we should take it easy."]],
  dev: ["breeze", ["Kya mast hawa hai! Idhar rukte hain?", "क्या मस्त हवा है! इधर रुकते हैं?", "What a lovely breeze! Shall we stop here?"], ["Haan, yahin se photo bhi mast aayega.", "हाँ, यहीं से फ़ोटो भी मस्त आएगा।", "Yes, the photo will look great from here too."]],
  asha: ["breeze", ["Aaj ki hawa mein maza aa raha hai na?", "आज की हवा में मज़ा आ रहा है ना?", "Enjoying today's breeze, aren't you?"], ["Haan! Chala, do minute yahin rukte hain.", "हाँ! चला, दो मिनट यहीं रुकते हैं।", "Yes! Let's stop here for two minutes."]],
  ganesh: ["chai", ["Maal rakh diya. Chala, ek chai?", "माल रख दिया। चला, एक चाय?", "The stock is put away. How about chai?"], ["Haan, kaam ke baad chai ka maza hai!", "हाँ, काम के बाद चाय का मज़ा है!", "Yes, chai is lovely after work!"]],
};

export function recordingLines() {
  return dialogue.flatMap((character) => {
    const counts = new Map();
    const conversation = conversations[character.id];
    const entries = [...character.lines];
    if (conversation) {
      const [topic, ask, reply] = conversation;
      entries.push({ ...line("chat", ...ask), topic }, { ...line("reply", ...reply), topic });
    }
    return entries.map((entry) => {
      const index = (counts.get(entry.event) ?? 0) + 1;
      counts.set(entry.event, index);
      return {
        id: `mum_${character.id}_${entry.event}_${String(index).padStart(2, "0")}`,
        characterId: character.id,
        language: "hi",
        secondaryLanguage: "mr",
        direction: character.direction,
        ...entry,
      };
    });
  });
}

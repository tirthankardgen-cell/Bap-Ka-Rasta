// Original Mumbai dialogue. Only the Devanagari text is sent to ElevenLabs.
const line = (event, subtitle, text, meaning) => ({ event, subtitle, text, meaning });
const person = (id, age, gender, direction, lines) => ({ id, age, gender, direction, lines });

export const dialogue = [
  person("sachin", 32, "male", "Warm Mumbai driver, speaking easily rather than announcing catchphrases.", [
    line("ignition", "Meter chaalu. Aaj samundar wale raste se nikalte hain.", "मीटर चालू। आज समंदर वाले रास्ते से निकलते हैं।", "Meter on. Let's take the seaside road today."),
    line("red_wait", "Laal batti hai. Jaldi karke bhi kya milna hai?", "लाल बत्ती है। जल्दी करके भी क्या मिलना है?", "It's a red light. What's the point of rushing?"),
    line("waterfront", "Is hawa ke liye toh roz idhar aana banta hai.", "इस हवा के लिए तो रोज़ इधर आना बनता है।", "This breeze is worth coming here every day."),
    line("stand", "Apna adda! Dekhein, aaj kiski kahaani chal rahi hai.", "अपना अड्डा! देखें, आज किसकी कहानी चल रही है।", "Our stand! Let's hear today's stories."),
  ]),
  person("raju", 58, "male", "Older driver with affectionate dry humour; an easy conversation.", [
    line("greet_intro", "Sachin! Chaabi le li? Aaj lambi sair ka iraada hai?", "सचिन! चाबी ले ली? आज लंबी सैर का इरादा है?", "Sachin! Got the keys? Planning a long drive today?"),
    line("ambient", "Paintees saal se meter chala raha hoon. Kisse bahut hain.", "पैंतीस साल से मीटर चला रहा हूँ। किस्से बहुत हैं।", "Thirty-five years behind a meter. Plenty of stories."),
    line("warning", "O driver! Sadak dekh, mujhe retirement toh lene de!", "ओ ड्राइवर! सड़क देख, मुझे रिटायरमेंट तो लेने दे!", "Watch the road, driver! Let me reach retirement!"),
  ]),
  person("meera", 43, "female", "Chai-stall owner, warm and busy, with a smile in her voice.", [
    line("ambient", "Adrak ki chai! Biscuit dubana, par cup mein chhodna mat.", "अदरक की चाय! बिस्कुट डुबाना, पर कप में छोड़ना मत।", "Ginger chai! Dip your biscuit, but don't leave it in the cup."),
    line("warning", "Garam ketli hai! Gaadi zara udhar rakhna!", "गरम केतली है! गाड़ी ज़रा उधर रखना!", "This kettle's hot! Keep your vehicle over there!"),
  ]),
  person("sameer", 28, "male", "Practical young mechanic, low and conversational, amused by workshop life.", [
    line("ambient", "Pana kidhar gaya? Abhi toh yahin rakha tha.", "पाना किधर गया? अभी तो यहीं रखा था।", "Where's my spanner? I just put it here."),
    line("warning", "Brake daba! Yahaan neeche auzaar pade hain!", "ब्रेक दबा! यहाँ नीचे औज़ार पड़े हैं!", "Hit the brakes! There are tools down here!"),
  ]),
  person("aarti", 27, "female", "Young office commuter, alert and slightly hurried, talking to a neighbour.", [
    line("ambient", "Phone ki battery gayi. Ab boss ko kya bahaana doon?", "फ़ोन की बैटरी गई। अब बॉस को क्या बहाना दूँ?", "My phone's dead. What excuse do I give my boss?"),
    line("warning", "Saamne dekhiye! Bag se zyada meri jaan keemti hai!", "सामने देखिए! बैग से ज़्यादा मेरी जान कीमती है!", "Look ahead! My life's worth more than my bag!"),
  ]),
  person("imran", 21, "male", "College student, playful and quick, chatting without shouting.", [
    line("ambient", "Attendance kam hai, par canteen waala mujhe roz dekhta hai.", "अटेंडेंस कम है, पर कैंटीन वाला मुझे रोज़ देखता है।", "My attendance is low, but the canteen guy sees me daily."),
    line("warning", "Hero, picture ki shooting nahi chal rahi! Brake maar!", "हीरो, पिक्चर की शूटिंग नहीं चल रही! ब्रेक मार!", "Hero, this isn't a film shoot! Brake!"),
  ]),
  person("lata", 55, "female", "Mature flower seller with a gentle Marathi cadence and earthy humour.", [
    line("ambient", "Mogryacha gajra ghya! Aaj ke phool bade khushboodaar hain.", "मोगऱ्याचा गजरा घ्या! आज के फूल बड़े ख़ुशबूदार हैं।", "Take a jasmine garland! Today's flowers smell wonderful."),
    line("warning", "Tokri bachao! Subah se piroye hain ye phool!", "टोकरी बचाओ! सुबह से पिरोए हैं ये फूल!", "Mind the basket! I've been threading these flowers all morning!"),
  ]),
  person("patil", 45, "male", "Male traffic constable, firm and clear, relaxed when chatting off duty.", [
    line("ambient", "Zebra crossing khaali rakhiye. Paidal waalon ko bhi nikalne dijiye.", "ज़ेब्रा क्रॉसिंग खाली रखिए। पैदल वालों को भी निकलने दीजिए।", "Keep the crossing clear. Let people walk through."),
    line("warning", "Gaadi roko! Logon ke beech aise chalaate hain kya?", "गाड़ी रोको! लोगों के बीच ऐसे चलाते हैं क्या?", "Stop! Is that how you drive around people?"),
  ]),
  person("nilesh", 38, "male", "Dabbawala, brisk but friendly, speaking in short natural phrases.", [
    line("ambient", "Naam dekh ke dabba uthao. Kal sabzi badal gayi thi!", "नाम देख के डब्बा उठाओ। कल सब्ज़ी बदल गई थी!", "Check the name on the tiffin. Yesterday the lunches got swapped!"),
    line("warning", "Khaana gir jaayega! Thodi jagah chhod ke chalo!", "खाना गिर जाएगा! थोड़ी जगह छोड़ के चलो!", "You'll spill the food! Leave some room!"),
  ]),
  person("farah", 36, "female", "Confident fruit seller, clear market projection, easy neighbourhood gossip.", [
    line("ambient", "Papita meetha niklega. Shakal pe mat jaao iski!", "पपीता मीठा निकलेगा। शक्ल पे मत जाओ इसकी!", "This papaya will be sweet. Don't judge its looks!"),
    line("warning", "Mera thela! Nazar road pe rakho, phone pe nahi!", "मेरा ठेला! नज़र रोड पे रखो, फ़ोन पे नहीं!", "My cart! Eyes on the road, not your phone!"),
  ]),
  person("suresh", 61, "male", "Older newspaper seller, textured and wry, never a loud announcer.", [
    line("ambient", "Akhbaar le lo! Mobile ki battery se toh nahi chalta.", "अख़बार ले लो! मोबाइल की बैटरी से तो नहीं चलता।", "Get your newspaper! It doesn't run on phone batteries."),
    line("warning", "Khabar bechta hoon, khud khabar nahi banna mujhe!", "ख़बर बेचता हूँ, ख़ुद ख़बर नहीं बनना मुझे!", "I sell the news. I don't want to become the news!"),
  ]),
  person("pooja", 26, "female", "Young nurse after her shift, soft, tired and gently funny.", [
    line("ambient", "Aaj bina alarm ke soungi. Koi phone mat karna.", "आज बिना अलार्म के सोऊँगी। कोई फ़ोन मत करना।", "I'm sleeping without an alarm today. Nobody call me."),
    line("warning", "Hospital se nikli hoon abhi! Waapas bhejne ka iraada hai?", "हॉस्पिटल से निकली हूँ अभी! वापस भेजने का इरादा है?", "I just left the hospital! Are you sending me back?"),
  ]),
  person("vikram", 35, "male", "Office commuter, contained and dryly amused by daily life.", [
    line("ambient", "Meeting khatam hui, toh uski meeting ka mail aa gaya.", "मीटिंग ख़त्म हुई, तो उसकी मीटिंग का मेल आ गया।", "The meeting ended, then an email arrived about another meeting."),
    line("warning", "Laptop toot jaayega! Insurance mein tera naam likhwaaun kya?", "लैपटॉप टूट जाएगा! इंश्योरेंस में तेरा नाम लिखवाऊँ क्या?", "You'll break my laptop! Should I name you on the claim?"),
  ]),
  person("zoya", 22, "female", "Curious young artist, light and expressive, speaking to a friend.", [
    line("ambient", "Purani imaaraton ke rang photo se zyada sundar lagte hain.", "पुरानी इमारतों के रंग फ़ोटो से ज़्यादा सुंदर लगते हैं।", "Old buildings have lovelier colours in person than in photos."),
    line("warning", "Meri drawing! Itni chaudi sadak bhi kam pad rahi hai?", "मेरी ड्रॉइंग! इतनी चौड़ी सड़क भी कम पड़ रही है?", "My drawing! Isn't this road wide enough for you?"),
  ]),
  person("bala", 25, "male", "Young delivery rider, energetic, informal and lightly sarcastic.", [
    line("ambient", "Address mein 'bade ped ke paas' likha hai. Kaunsa ped?", "एड्रेस में बड़े पेड़ के पास लिखा है। कौन सा पेड़?", "The address says near the big tree. Which tree?"),
    line("warning", "Dekh ke! Parcel pe fragile likha hai, mujhpe bhi samajh!", "देख के! पार्सल पे फ़्रैजाइल लिखा है, मुझपे भी समझ!", "Watch it! The parcel says fragile. So am I!"),
  ]),
  person("jyoti", 41, "female", "Street worker, steady and matter-of-fact, with understated wit.", [
    line("ambient", "Kachra dabbe ke andar daalo. Paas mein nahi, andar!", "कचरा डब्बे के अंदर डालो। पास में नहीं, अंदर!", "Put rubbish inside the bin. Not beside it, inside!"),
    line("warning", "Jhaadu dikh raha hai? Safai karoon ya tujhe bachaaun?", "झाड़ू दिख रहा है? सफ़ाई करूँ या तुझे बचाऊँ?", "See the broom? Should I clean or dodge your vehicle?"),
  ]),
  person("shanta", 70, "female", "Older grandmother, warm, measured and amused, without a frail caricature.", [
    line("ambient", "Amchya veli yahaan cycle chalti thi. Ab sabko jaldi hai.", "आमच्या वेळी यहाँ साइकिल चलती थी। अब सबको जल्दी है।", "In our day, bicycles came through here. Now everyone's rushing."),
    line("warning", "Beta, aankhein khol! Mujhe ghar tak toh pahunchne de!", "बेटा, आँखें खोल! मुझे घर तक तो पहुँचने दे!", "Open your eyes, dear! At least let me get home!"),
  ]),
  person("dev", 30, "male", "Photographer, polite and curious, clear conversational Hindi.", [
    line("ambient", "Kabootar bhi pose de raha hai. Insaan hi jaldi mein hain.", "कबूतर भी पोज़ दे रहा है। इंसान ही जल्दी में हैं।", "Even the pigeon is posing. Only people are in a hurry."),
    line("warning", "Camera sambhalun ya khud ko? Horn se sab nahi hota!", "कैमरा संभालूँ या ख़ुद को? हॉर्न से सब नहीं होता!", "Save my camera or myself? A horn doesn't solve everything!"),
  ]),
  person("asha", 29, "female", "Upbeat jogger, energetic and a little breathy, talking normally.", [
    line("ambient", "Ghadi bolti hai das hazaar steps. Pair bolte hain bas.", "घड़ी बोलती है दस हज़ार स्टेप्स। पैर बोलते हैं बस।", "My watch says ten thousand steps. My feet say enough."),
    line("warning", "Footpath pe bhi race? Mujhe jogging toh karne do!", "फ़ुटपाथ पे भी रेस? मुझे जॉगिंग तो करने दो!", "Racing on the pavement too? Let me jog!"),
  ]),
  person("ganesh", 40, "male", "Shop worker, resonant, practical and friendly, with an ordinary speaking voice.", [
    line("ambient", "Udhaar kal se band. Ye board roz lagana padta hai.", "उधार कल से बंद। ये बोर्ड रोज़ लगाना पड़ता है।", "No credit from tomorrow. I put that sign up every day."),
    line("warning", "Peti girti toh saara maal toot jaata! Sambhaal gaadi!", "पेटी गिरती तो सारा माल टूट जाता! संभाल गाड़ी!", "If this crate fell, the stock would break! Control your vehicle!"),
  ]),
];

// Shared topics have compatible meanings; two topics per person vary each pair.
const talk = (topic, ask, reply) => ({ topic, ask, reply });
const conversations = {
  raju: [
    talk("cricket", ["Kal ka match dekha? Aakhri over mein jaan atak gayi!", "कल का मैच देखा? आख़िरी ओवर में जान अटक गई!", "Saw the match? That last over was tense!"], ["Hamare adde pe toh sab kursi chhod ke khade the!", "हमारे अड्डे पे तो सब कुर्सी छोड़ के खड़े थे!", "Everyone at our stand was out of their seat!"]),
    talk("prices", ["Sabzi ka bhaav suna? Tamatar bade akad mein hain!", "सब्ज़ी का भाव सुना? टमाटर बड़े अकड़ में हैं!", "Seen vegetable prices? Tomatoes are getting rather proud!"], ["Pehle thaila bharta tha. Ab jeb khaali hoti hai.", "पहले थैला भरता था। अब जेब खाली होती है।", "The bag used to fill up. Now the pocket just empties."]),
  ],
  meera: [
    talk("cricket", ["Aakhri ball pe sab cheekhe na? Chai bhi uchhal gayi!", "आख़िरी बॉल पे सब चीखे ना? चाय भी उछल गई!", "Everyone yelled on that last ball, right? Even the chai jumped!"], ["Meri tapri pe toh cup rakhne ki jagah nahi thi!", "मेरी टपरी पे तो कप रखने की जगह नहीं थी!", "My stall was so packed there was nowhere for a cup!"]),
    talk("prices", ["Bazaar mein aaj phir rate badhe kya?", "बाज़ार में आज फिर रेट बढ़े क्या?", "Did market prices go up again today?"], ["Sab mehenga. Chai mein pyaar abhi bhi muft hai!", "सब महँगा। चाय में प्यार अभी भी मुफ़्त है!", "Everything's costly. Love in the chai is still free!"]),
  ],
  sameer: [
    talk("cricket", ["Us match ka aakhri over! Tune saans li thi kya?", "उस मैच का आख़िरी ओवर! तूने साँस ली थी क्या?", "That last over! Were you even breathing?"], ["Garage ka kaam rok diya tha. Kya finish tha!", "गैराज का काम रोक दिया था। क्या फ़िनिश था!", "We stopped work at the garage. What a finish!"]),
    talk("rain", ["Baadal dekh. Lagta hai aaj paani barsega?", "बादल देख। लगता है आज पानी बरसेगा?", "Look at those clouds. Think it'll rain?"], ["Auzaar andar kar leta hoon. Zang phir saaf karna padega.", "औज़ार अंदर कर लेता हूँ। ज़ंग फिर साफ़ करना पड़ेगा।", "I'll bring the tools in. Otherwise I'll be cleaning off rust."]),
  ],
  aarti: [
    talk("train", ["Subah ki local mein khade hone ki jagah mili?", "सुबह की लोकल में खड़े होने की जगह मिली?", "Was there even standing room on the morning local?"], ["Bag andar tha, main darwaaze pe. Roz ka yoga!", "बैग अंदर था, मैं दरवाज़े पे। रोज़ का योगा!", "My bag was inside; I was at the door. Daily yoga!"]),
    talk("rent", ["Tera bhi kiraya badha kya? Malik ka message aaya hai.", "तेरा भी किराया बढ़ा क्या? मालिक का मैसेज आया है।", "Did your rent go up too? My landlord texted."], ["Tankhwaah wahi, kiraya naya. Hisaab kaise baithega?", "तनख़्वाह वही, किराया नया। हिसाब कैसे बैठेगा?", "Same salary, new rent. How will that add up?"]),
  ],
  imran: [
    talk("cricket", ["Bhai, kal ka finish dekha? Poora hostel uchhal pada!", "भाई, कल का फ़िनिश देखा? पूरा हॉस्टल उछल पड़ा!", "Saw yesterday's finish? The whole hostel jumped!"], ["Highlights teen baar dekhe. Phir bhi dhadkan tez hoti hai!", "हाइलाइट्स तीन बार देखे। फिर भी धड़कन तेज़ होती है!", "Watched the highlights three times. Still gets my heart racing!"]),
    talk("train", ["Aaj local mein chadh paaye? Bheed zabardast thi.", "आज लोकल में चढ़ पाए? भीड़ ज़बरदस्त थी।", "Managed to board the local? It was packed."], ["Chadh toh gaya. Utarne ka plan agle station pe bana.", "चढ़ तो गया। उतरने का प्लान अगले स्टेशन पे बना।", "I got on. Figured out getting off at the next station."]),
  ],
  lata: [
    talk("prices", ["Bhaji ke daam dekhe? Aaj toh kamaal ho gaya.", "भाजी के दाम देखे? आज तो कमाल हो गया।", "Seen vegetable prices? Today was something else."], ["Aadha kilo liya, phir bhi sau ka note gaya.", "आधा किलो लिया, फिर भी सौ का नोट गया।", "Bought half a kilo and still lost a hundred."]),
    talk("rain", ["Paaoos yenaar ka? Aasmaan ka rang badal raha hai.", "पाऊस येणार का? आसमान का रंग बदल रहा है।", "Will it rain? The sky's changing colour."], ["Phool dhak deti hoon. Bheeg gaye toh kaun lega?", "फूल ढक देती हूँ। भीग गए तो कौन लेगा?", "I'll cover the flowers. Who'd buy them soaked?"]),
  ],
  patil: [
    talk("train", ["Local ki bheed ka kya haal tha aaj?", "लोकल की भीड़ का क्या हाल था आज?", "How crowded was the local today?"], ["Platform bhi bhara tha. Sab ek hi waqt nikalte hain.", "प्लैटफ़ॉर्म भी भरा था। सब एक ही वक़्त निकलते हैं।", "Even the platform was full. Everyone leaves at the same time."]),
    talk("rain", ["Aaj baarish lag rahi hai. Chhatri laaye ho?", "आज बारिश लग रही है। छतरी लाए हो?", "Looks like rain. Did you bring an umbrella?"], ["Raincoat chowki mein hai. Bas pehle wahaan pahunch jaaun.", "रेनकोट चौकी में है। बस पहले वहाँ पहुँच जाऊँ।", "My raincoat's at the post. Hope I get there first."]),
  ],
  nilesh: [
    talk("train", ["Subah train mein pair rakhne ki jagah thi kya?", "सुबह ट्रेन में पैर रखने की जगह थी क्या?", "Was there room to put a foot on the train?"], ["Dabbon ko jagah mili. Mujhe kisi tarah mil gayi.", "डब्बों को जगह मिली। मुझे किसी तरह मिल गई।", "The tiffins got space. I somehow squeezed in."]),
    talk("prices", ["Aaj sabzi khareedi? Rate sun ke paseena aa gaya.", "आज सब्ज़ी ख़रीदी? रेट सुन के पसीना आ गया।", "Bought vegetables today? Those prices made me sweat."], ["Ghar se list aayi thi. Aadhee hi le paaya.", "घर से लिस्ट आई थी। आधी ही ले पाया।", "Got a shopping list from home. Could only buy half."]),
  ],
  farah: [
    talk("prices", ["Sabzi mandi mein bhaav badh gaye, suna tune?", "सब्ज़ी मंडी में भाव बढ़ गए, सुना तूने?", "Heard the vegetable wholesale prices went up?"], ["Khareedne waala bhi roye, bechne waala bhi. Kamaal hai!", "ख़रीदने वाला भी रोए, बेचने वाला भी। कमाल है!", "The buyer cries, the seller cries. Amazing!"]),
    talk("rain", ["Ye baadal toh barasne waale lag rahe hain, nahi?", "ये बादल तो बरसने वाले लग रहे हैं, नहीं?", "Those clouds look ready to rain, don't they?"], ["Tirpaal taiyaar hai. Pichhli baar sab bheeg gaya tha.", "तिरपाल तैयार है। पिछली बार सब भीग गया था।", "The tarpaulin's ready. Last time everything got soaked."]),
  ],
  suresh: [
    talk("cricket", ["Kal match ke waqt gali ka shor suna tha?", "कल मैच के वक़्त गली का शोर सुना था?", "Heard the lane during yesterday's match?"], ["Akhbaar ki headline bhi wahi. Kamaal ka match tha.", "अख़बार की हेडलाइन भी वही। कमाल का मैच था।", "It made the paper's headline too. Wonderful match."]),
    talk("rent", ["Makaan waalon ne phir kiraya badha diya kya?", "मकान वालों ने फिर किराया बढ़ा दिया क्या?", "Did the landlords raise rent again?"], ["Purane din yaad aate hain. Tab kamra sasta tha.", "पुराने दिन याद आते हैं। तब कमरा सस्ता था।", "I miss the old days. A room was affordable then."]),
  ],
  pooja: [
    talk("train", ["Local mein aaj bhi dhakka-mukki thi kya?", "लोकल में आज भी धक्का-मुक्की थी क्या?", "Was everyone jostling on the local again?"], ["Baithna toh door, bag rakhna mushkil tha.", "बैठना तो दूर, बैग रखना मुश्किल था।", "Forget sitting; even finding room for a bag was hard."]),
    talk("rent", ["Is mahine kiraya badha? Mere yahaan bhi baat chal rahi hai.", "इस महीने किराया बढ़ा? मेरे यहाँ भी बात चल रही है।", "Did rent rise this month? They're discussing it at mine too."], ["Roommate dhoondhni padegi. Akele ab mushkil ho raha hai.", "रूममेट ढूँढनी पड़ेगी। अकेले अब मुश्किल हो रहा है।", "I'll need a roommate. It's getting hard on my own."]),
  ],
  vikram: [
    talk("rent", ["Kiraye ka naya message aaya kya? Darr lagta hai kholne se.", "किराए का नया मैसेज आया क्या? डर लगता है खोलने से।", "Got the new rent message? I'm afraid to open mine."], ["Balkani utni hi chhoti. Kiraya bada hota jaa raha hai.", "बालकनी उतनी ही छोटी। किराया बड़ा होता जा रहा है।", "The balcony stays tiny. The rent keeps growing."]),
    talk("cricket", ["Aakhri over wala match dekha na? Kya chakkar tha!", "आख़िरी ओवर वाला मैच देखा ना? क्या चक्कर था!", "Saw that match go to the last over? What a ride!"], ["Office group mein abhi tak usi ki charcha hai.", "ऑफ़िस ग्रुप में अभी तक उसी की चर्चा है।", "The office group is still talking about it."]),
  ],
  zoya: [
    talk("rain", ["Aasmaan dekho. Baarish hone waali hai kya?", "आसमान देखो। बारिश होने वाली है क्या?", "Look at the sky. Is it about to rain?"], ["Kaagaz andar rakh loon. Ye rang paani mein beh jaayenge.", "काग़ज़ अंदर रख लूँ। ये रंग पानी में बह जाएँगे।", "I'll put the paper away. These colours will wash off."]),
    talk("rent", ["Tumhare yahaan bhi kiraya badh raha hai?", "तुम्हारे यहाँ भी किराया बढ़ रहा है?", "Is the rent going up at your place too?"], ["Itne mein toh deewar pe painting bhi meri honi chahiye.", "इतने में तो दीवार पे पेंटिंग भी मेरी होनी चाहिए।", "For that price, I should at least get to paint the walls."]),
  ],
  bala: [
    talk("train", ["Aaj local phir thoons ke bhari thi kya?", "आज लोकल फिर ठूँस के भरी थी क्या?", "Was the local crammed full again today?"], ["Ek station ke liye chadha, teen aage jaake utara.", "एक स्टेशन के लिए चढ़ा, तीन आगे जाके उतरा।", "Got on for one stop, managed to get off three later."]),
    talk("rent", ["Tera landlord bhi kiraya badha raha hai kya?", "तेरा लैंडलॉर्ड भी किराया बढ़ा रहा है क्या?", "Is your landlord raising the rent too?"], ["Kamra chhota, bill bada. Mumbai ka alag hi hisaab hai.", "कमरा छोटा, बिल बड़ा। मुंबई का अलग ही हिसाब है।", "Small room, big bill. Mumbai has its own maths."]),
  ],
  jyoti: [
    talk("rain", ["Hawa badal gayi. Aaj baarish hogi na?", "हवा बदल गई। आज बारिश होगी ना?", "The wind changed. It'll rain today, won't it?"], ["Naala saaf kar diya. Ab log kachra na daalein bas.", "नाला साफ़ कर दिया। अब लोग कचरा ना डालें बस।", "The drain's clear. I just hope nobody throws rubbish in."]),
    talk("prices", ["Sabzi waale ne naya bhaav bataya? Kitna badh gaya!", "सब्ज़ी वाले ने नया भाव बताया? कितना बढ़ गया!", "Heard the new vegetable prices? They've shot up!"], ["Daam badhte hain, tankhwaah sochti hi reh jaati hai.", "दाम बढ़ते हैं, तनख़्वाह सोचती ही रह जाती है।", "Prices go up; the salary is still thinking about it."]),
  ],
  shanta: [
    talk("prices", ["Batao, aaj bhaji kitne ki mili? Bhaav sunke darr lagta hai.", "बताओ, आज भाजी कितने की मिली? भाव सुनके डर लगता है।", "What did vegetables cost today? The prices scare me."], ["Pehle das rupaye mein thaila bharta tha, beta.", "पहले दस रुपये में थैला भरता था, बेटा।", "Once, ten rupees filled a bag, dear."]),
    talk("rent", ["Pados ke ghar ka kiraya bhi badha kya?", "पड़ोस के घर का किराया भी बढ़ा क्या?", "Did the neighbours' rent go up too?"], ["Ghar wahi purana, par bhaav har saal naya.", "घर वही पुराना, पर भाव हर साल नया।", "Same old house, a new price every year."]),
  ],
  dev: [
    talk("rain", ["Ye kaale baadal dekhe? Baarish kareeb lag rahi hai.", "ये काले बादल देखे? बारिश करीब लग रही है।", "Seen those dark clouds? Rain looks close."], ["Camera dhak liya. Bheegi sadak ki photo achhi aayegi.", "कैमरा ढक लिया। भीगी सड़क की फ़ोटो अच्छी आएगी।", "Camera's covered. The wet road will make a lovely photo."]),
    talk("cricket", ["Kal ke match mein poori gali jaag rahi thi, na?", "कल के मैच में पूरी गली जाग रही थी, ना?", "The whole lane was awake for yesterday's match, right?"], ["Us jeet ke baad chehron ki photo leni chahiye thi.", "उस जीत के बाद चेहरों की फ़ोटो लेनी चाहिए थी।", "I should've photographed those faces after the win."]),
  ],
  asha: [
    talk("cricket", ["Match ka woh aakhri over yaad hai? Neend ud gayi thi!", "मैच का वो आख़िरी ओवर याद है? नींद उड़ गई थी!", "Remember that last over? It kept me wide awake!"], ["Cheekh-cheekh ke gala baith gaya. Mazedaar match tha!", "चीख चीख के गला बैठ गया। मज़ेदार मैच था!", "Lost my voice cheering. What a fun match!"]),
    talk("rain", ["Aaj baarish padegi kya? Baadal toh poore taiyaar hain.", "आज बारिश पड़ेगी क्या? बादल तो पूरे तैयार हैं।", "Will it rain today? The clouds certainly look ready?"], ["Bheegte hue daudna achha lagta hai. Phone bachana padega.", "भीगते हुए दौड़ना अच्छा लगता है। फ़ोन बचाना पड़ेगा।", "I like running in the rain. Need to protect my phone."]),
  ],
  ganesh: [
    talk("prices", ["Mandi ke rate dekhe? Sabzi bhi sona ho gayi.", "मंडी के रेट देखे? सब्ज़ी भी सोना हो गई।", "Seen market prices? Vegetables are gold now."], ["Grahak mujhse lade, main kisse ladoon? Daam hi aise hain.", "ग्राहक मुझसे लड़े, मैं किससे लड़ूँ? दाम ही ऐसे हैं।", "Customers argue with me. Who do I argue with? Those prices!"]),
    talk("train", ["Local ki bheed se bach paaye aaj?", "लोकल की भीड़ से बच पाए आज?", "Managed to escape the local's crowd today?"], ["Do train chhodi. Teesri mein kisi tarah chadha.", "दो ट्रेन छोड़ी। तीसरी में किसी तरह चढ़ा।", "Let two trains go. Somehow boarded the third."]),
  ],
};

export function recordingLines() {
  return dialogue.flatMap((character) => {
    const counts = new Map();
    const entries = [...character.lines];
    for (const { topic, ask, reply } of conversations[character.id] ?? []) {
      entries.push({ ...line("chat", ...ask), topic }, { ...line("reply", ...reply), topic });
    }
    return entries.map((entry) => {
      const index = (counts.get(entry.event) ?? 0) + 1;
      counts.set(entry.event, index);
      return { id: `mum_${character.id}_${entry.event}_${String(index).padStart(2, "0")}`, characterId: character.id, direction: character.direction, ...entry };
    });
  });
}

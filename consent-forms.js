// Consent content for each bookable service. HBOT text is the clinic's own form.
// The other services are drafts that need review by the Medical Director and the clinic's attorney.
(function () {
  var hbot = {
  "id": "hbot",
  "name": "Hyperbaric Oxygen Therapy",
  "formTitle": "Hyperbaric Oxygen Therapy Consent Form",
  "blurb": "Pressurized oxygen in a private hard-shell chamber",
  "time": "60 to 90 minutes",
  "screens": [
    {
      "name": "rx",
      "title": "Are you currently prescribed or taking any of these medications?",
      "options": [
        {
          "value": "Bleomycin",
          "label": "Bleomycin",
          "none": false
        },
        {
          "value": "Disulfiram",
          "label": "Disulfiram",
          "none": false
        },
        {
          "value": "Mafenide acetate",
          "label": "Mafenide acetate",
          "none": false
        },
        {
          "value": "None of these",
          "label": "None of these",
          "none": true
        }
      ]
    },
    {
      "name": "dx",
      "title": "Have you been diagnosed with, or are you suspected of having, any of the following?",
      "options": [
        {
          "value": "Hereditary spherocytosis",
          "label": "Hereditary spherocytosis",
          "none": false
        },
        {
          "value": "Sickle cell anemia",
          "label": "Sickle cell anemia",
          "none": false
        },
        {
          "value": "COPD",
          "label": "COPD",
          "none": false
        },
        {
          "value": "None of these",
          "label": "None of these",
          "none": true
        }
      ]
    }
  ],
  "contra": {
    "title": "I understand I should not undergo treatment if I have any of the following diagnoses or symptoms. Select any that apply to you.",
    "options": [
      {
        "value": "High fever",
        "label": "High fever",
        "none": false
      },
      {
        "value": "Flown in the last 24 hours",
        "label": "Have flown in the last 24 hours",
        "none": false
      },
      {
        "value": "Ear infection or blocked ear canal",
        "label": "Ear infection or blocked ear canal",
        "none": false
      },
      {
        "value": "Optic neuritis",
        "label": "Optic neuritis",
        "none": false
      },
      {
        "value": "Severe lung or heart disease",
        "label": "Severe lung or heart disease",
        "none": false
      },
      {
        "value": "Full or partial pneumothorax",
        "label": "Full or partial pneumothorax (collapsed lung)",
        "none": false
      },
      {
        "value": "Seizure disorder",
        "label": "Seizure disorder",
        "none": false
      },
      {
        "value": "Emphysema",
        "label": "Emphysema",
        "none": false
      },
      {
        "value": "Sinus or upper respiratory infection",
        "label": "Sinus or upper respiratory infection",
        "none": false
      },
      {
        "value": "Glaucoma",
        "label": "Glaucoma",
        "none": false
      },
      {
        "value": "Aneurysm",
        "label": "Aneurysm",
        "none": false
      },
      {
        "value": "Untreated asthma or asthma attack in last 24 hours",
        "label": "Untreated asthma, or an asthma attack in the last 24 hours",
        "none": false
      },
      {
        "value": "None of the above apply to me",
        "label": "None of the above apply to me",
        "none": true
      }
    ]
  },
  "acks": [
    {
      "id": "i_about",
      "title": "About hyperbaric oxygen therapy",
      "paras": [
        "Hyperbaric Oxygen Therapy (HBOT) is a therapy that increases the amount of oxygen the body can absorb at a cellular level. The treatment supplies oxygen in a sealed chamber at a higher-than-normal atmospheric pressure, which allows the oxygen to dissolve more easily into liquids such as blood plasma and cerebrospinal fluid. The body’s absorption of the increased oxygen is reported to be beneficial for a wide range of ailments. However, the FDA only approves HBOT for certain specific conditions. Other conditions for which HBOT is often used are considered “off-label.” Although many off-label conditions have been studied with positive results, I understand that no treatment outcome is guaranteed, and the fees I pay are for services rendered, not for any benefits I may receive or expect or hope to receive. I understand it is possible that I may not observe or realize any benefit from the treatment, and that HBOT is not intended as a cure for any condition or disease. I further understand the treatment is not a substitute for other treatment suggested or prescribed by my physician."
      ]
    },
    {
      "id": "i_ear",
      "title": "Ear pressure (otic barotrauma)",
      "paras": [
        "Possible side effects of HBOT include otic barotrauma: ear pain or damage to the eardrum caused by rapid changes in pressure, such as when a plane descends to land. To keep pressure equal on both sides of the eardrum, air must move freely between the nasopharynx and middle ear. When the chamber is pressurized, I understand that I must be able to equalize the pressure in my ears to avoid possible severe ear discomfort. The most effective method is to hold the nose, close the mouth, and blow gently through the nose. Other methods include yawning, swallowing, and holding the nose while swallowing.",
        "<strong>If the pressure in my ears fails to equalize using any of these methods, I agree to tell the attendant about any discomfort immediately.</strong> The attendant will adjust the pressure to try to relieve the discomfort, but if the pressure in my ears cannot be equalized, the treatment will be stopped promptly. In that event, I understand no further sessions will be scheduled for me until I have obtained a release from my physician."
      ]
    },
    {
      "id": "i_gi",
      "title": "Gastrointestinal effects",
      "paras": [
        "I understand that HBOT may assist my body in detoxifying digestive flora. As a result, I may experience some discomfort within the first 36 hours following a session. Symptoms may include loss of appetite, stomachache, constipation or diarrhea, headache, body aches, irritability, or other emotional upset. I understand that although this is a normal process, if symptoms persist beyond 36 hours, I must consult a physician for evaluation."
      ]
    },
    {
      "id": "i_sugar",
      "title": "Drop in blood sugar",
      "paras": [
        "Insulin-dependent diabetics may experience a drop in blood sugar while in the chamber. If I take insulin, I understand that I must test my blood sugar before my session and eat a snack if my level is under 150. I must test again when I leave the chamber and eat a snack before leaving the facility if my level is under 150. I agree to tell the attendant immediately if I feel uncomfortable at any time during the session."
      ]
    },
    {
      "id": "i_other",
      "title": "Other side effects",
      "paras": [
        "Other side effects may include headache, nausea, drowsiness, hyperactivity, dizziness, claustrophobia, or blurred vision."
      ]
    },
    {
      "id": "i_jewelry",
      "title": "Jewelry and sharp objects",
      "paras": [
        "Piercings and jewelry will need to be removed where possible. No sharp objects are allowed in the HBOT chamber."
      ]
    },
    {
      "id": "i_guarantee",
      "title": "No guarantee of results",
      "paras": [
        "Although hyperbaric therapy has been reported to be beneficial for a wide range of conditions, this therapy is not meant as a cure for any condition or disease, and no therapeutic outcome can be guaranteed. OxyLux Solutions does not in any way recommend HBOT as a substitute for any medical treatment prescribed or suggested by a physician, and makes no guarantee of any results an individual may experience."
      ]
    }
  ],
  "legal": [
    "I, {{NAME}}, acknowledge that I have read the above information completely. I have received answers to any questions I may have about the treatment. I am fully informed of the possible side effects and complications that may arise from the treatment. Being fully informed, I agree to obtain this treatment, and I hereby release and hold harmless OxyLux Solutions, its employees, agents, representatives, lessees, and assigns from liability for any and all effects or lack thereof, side effects, or complications that may arise as a result of the HBOT treatment.",
    "I hereby authorize OxyLux Solutions or its employees to take medical photographs for the purpose of teaching or publication. I understand that I will not be identified by name and that my anonymity will be preserved in any presentation or publication.",
    "I consent to the release of information and/or disclosure of any part of my medical record by any physician, hospital, accreditation, or regulatory organization responsible for monitoring or evaluating health facilities, as well as any other facility of which I have been a client."
  ]
};

  // Shared helpers for the services below
  function none(label) { return { value: label || 'None of these apply to me', label: label || 'None of these apply to me', none: true }; }
  function list(items) { return items.map(function (t) { return { value: t, label: t }; }).concat([none()]); }
  function legal(what) {
    return [
      'I, {{NAME}}, acknowledge that I have read the above information completely. I have had the chance to ask questions about ' + what + ' and have received answers. I am fully informed of the possible side effects and complications. Being fully informed, I agree to receive this treatment, and I hereby release and hold harmless OxyLux Solutions, its employees, agents, representatives, lessees, and assigns from liability for any and all effects or lack thereof, side effects, or complications that may arise as a result of the treatment.',
      'I understand that I may stop or refuse treatment at any time, and that I should tell a member of the OxyLux team right away if anything feels wrong during or after my visit.',
      'I consent to the release of information and/or disclosure of any part of my medical record by any physician, hospital, accreditation, or regulatory organization responsible for monitoring or evaluating health facilities, as well as any other facility of which I have been a client.'
    ];
  }
  function noGuarantee(what) {
    return { id: 'i_guarantee', title: 'No guarantee of results', paras: ['Results vary from person to person. I understand that OxyLux Solutions makes no guarantee of any result from ' + what + ', that it is not a cure for any condition or disease, and that it does not replace care from my physician. The fees I pay are for services rendered.'] };
  }

  var iv = {
    id: 'iv', name: 'IV Therapy', formTitle: 'IV Therapy Consent Form', blurb: 'Fluids and nutrients delivered through an IV', time: 'About 45 to 60 minutes',
    screens: [],
    contra: { title: 'I understand IV therapy may not be safe for me if any of the following apply. Select any that apply to you.', options: list([
      'Heart failure or other serious heart disease', 'Kidney disease, dialysis or reduced kidney function', 'Liver disease', 'High blood pressure that is not controlled', 'Fluid in the lungs or swelling in the legs', 'G6PD deficiency', 'Pregnant or breastfeeding', 'Bleeding disorder or taking blood thinners', 'Active infection or fever', 'Allergy to any vitamin, medication or ingredient in my IV'
    ]) },
    acks: [
      { id: 'i_about', title: 'About IV therapy', paras: ['IV therapy delivers fluids, vitamins, minerals or other ingredients directly into a vein through a small catheter. A licensed clinician will review my health history and decide whether IV therapy is appropriate for me and what it should contain. I understand that many IV wellness ingredients have not been evaluated by the FDA for wellness purposes.'] },
      { id: 'i_placement', title: 'IV placement risks', paras: ['Placing an IV may cause pain, bruising, swelling, or bleeding at the site. Less commonly, fluid can leak into the surrounding tissue (infiltration), the vein can become inflamed (phlebitis), a clot can form, a nerve can be irritated, or the site can become infected. More than one attempt may be needed. I will tell the clinician right away if I feel pain, burning or swelling.'] },
      { id: 'i_reaction', title: 'Reactions and fluid overload', paras: ['Possible reactions include flushing, a warm sensation, nausea, headache, dizziness, an unusual taste in the mouth, or fainting. Rarely, serious allergic reactions can occur and may be life-threatening. Too much fluid can strain the heart and lungs, which is a greater risk for people with heart or kidney disease. I will tell the clinician right away if I have chest pain, shortness of breath, rash, itching, or swelling of my face or throat.'] },
      { id: 'i_aftercare', title: 'After my visit', paras: ['I will watch the IV site for redness, warmth, swelling, drainage or increasing pain, and I will call OxyLux or seek medical care if any of these occur. If I have trouble breathing, chest pain, or swelling of my face or throat, I will call 911.'] },
      noGuarantee('IV therapy')
    ],
    legal: legal('IV therapy')
  };

  var massage = {
    id: 'massage', name: 'Massage Therapy', formTitle: 'Massage Therapy Consent Form', blurb: 'Therapeutic massage in a private suite', time: '60 minutes',
    screens: [],
    contra: { title: 'Massage may need to be changed or postponed if any of the following apply. Select any that apply to you.', options: list([
      'Fever or contagious illness', 'Blood clot or history of deep vein thrombosis', 'Taking blood thinners or a bleeding disorder', 'Recent surgery or injury', 'Pregnant', 'Cancer or current cancer treatment', 'Heart disease or uncontrolled high blood pressure', 'Skin infection, rash or open wound', 'Osteoporosis or recent fracture', 'Numbness or nerve condition'
    ]) },
    acks: [
      { id: 'i_about', title: 'About massage therapy', paras: ['Massage therapy is manual work on the muscles and soft tissue to support relaxation and ease tension. I understand that massage therapists do not diagnose illness or injury, and that massage does not replace medical care.'] },
      { id: 'i_effects', title: 'Possible effects', paras: ['I may feel soreness, tenderness, light bruising, fatigue or lightheadedness during or after a massage. Hot stones or other heat can irritate or burn the skin. I will tell my therapist right away if the pressure, temperature or any technique is uncomfortable, and the therapist will adjust or stop.'] },
      { id: 'i_comfort', title: 'Comfort and boundaries', paras: ['I will be properly draped at all times, and I can ask that any area be left untreated. I can end the session at any time for any reason. I understand massage at OxyLux is strictly therapeutic.'] },
      { id: 'i_disclose', title: 'Keeping my therapist informed', paras: ['I have listed all of my known health conditions and medications, and I will update my therapist if anything changes before a future session.'] },
      noGuarantee('massage therapy')
    ],
    legal: legal('massage therapy')
  };

  var infrared = {
    id: 'infrared', name: 'Infrared Therapy', formTitle: 'Infrared Therapy Consent Form', blurb: 'Soothing infrared heat session', time: '30 to 45 minutes',
    screens: [],
    contra: { title: 'I understand infrared heat may not be safe for me if any of the following apply. Select any that apply to you.', options: list([
      'Pregnant or trying to become pregnant', 'Pacemaker, defibrillator or other implanted device', 'Metal or silicone implants', 'Heart disease or high or low blood pressure', 'Fever or acute illness', 'Bleeding disorder or recent bleeding', 'Multiple sclerosis or another heat-sensitive condition', 'Reduced feeling in my skin, including from diabetes', 'Taking diuretics, beta-blockers, blood thinners or barbiturates', 'Recent injury or swelling in a joint'
    ]) },
    acks: [
      { id: 'i_about', title: 'About infrared therapy', paras: ['Infrared therapy uses infrared heat to warm the body. It is offered for relaxation and comfort, and it is not intended to diagnose, treat or cure any disease.'] },
      { id: 'i_heat', title: 'Heat, dehydration and fainting', paras: ['Heat exposure can cause dehydration, dizziness, lightheadedness, nausea, fainting, skin irritation or, rarely, burns. I will drink water before and after my session. I will not use alcohol or recreational drugs before a session. I will leave the session and tell a team member right away if I feel unwell.'] },
      { id: 'i_medical', title: 'Medications and devices', paras: ['Some medications affect how the body handles heat, and magnets or heat may affect implanted devices. I have listed my medications and implants on this form, and I will check with my physician if I am unsure whether infrared heat is safe for me.'] },
      noGuarantee('infrared therapy')
    ],
    legal: legal('infrared therapy')
  };

  var venus = {
    id: 'venus', name: 'Venus Legacy', formTitle: 'Venus Legacy Treatment Consent Form', blurb: 'Non-invasive skin and body treatment', time: '30 to 45 minutes',
    screens: [],
    contra: { title: 'I understand Venus Legacy treatment may not be safe for me if any of the following apply. Select any that apply to you.', options: list([
      'Pacemaker, defibrillator or other implanted electronic device', 'Metal implants near the treatment area', 'Pregnant, breastfeeding or undergoing IVF', 'Active infection or open wound in the treatment area', 'Skin cancer, or current cancer treatment', 'Herpes or other heat-triggered skin condition', 'Autoimmune disease affecting the skin', 'Bleeding disorder or taking blood thinners', 'Filler, injectables or a skin procedure in the area recently', 'Reduced feeling in the treatment area', 'Tattoos or permanent makeup in the treatment area'
    ]) },
    acks: [
      { id: 'i_about', title: 'About Venus Legacy', paras: ['Venus Legacy uses multi-polar radio frequency and pulsed electromagnetic fields to heat the skin and the tissue below it. It is non-invasive. I understand a series of treatments is usually recommended, and that any improvement in my skin or the appearance of cellulite is typically temporary and may need maintenance treatments.'] },
      { id: 'i_effects', title: 'Possible side effects', paras: ['During treatment I should feel warmth. Afterward I may have redness, warmth, tenderness or mild swelling that usually fades within hours. Less commonly, treatment may cause blistering, burns, bruising, or lighter or darker patches of skin, which could be lasting. I will tell my provider right away if the heat becomes uncomfortable.'] },
      { id: 'i_aftercare', title: 'Before and after treatment', paras: ['I will remove jewelry and metal from the treatment area. I will follow the aftercare instructions I am given, and I will contact OxyLux if I notice blistering, severe redness or anything else that concerns me.'] },
      noGuarantee('Venus Legacy treatment')
    ],
    legal: legal('Venus Legacy treatment')
  };

  var botox = {
    id: 'botox', name: 'Botox', formTitle: 'Botox Cosmetic Consent Form', blurb: 'Injections to soften facial lines', time: '30 minutes',
    screens: [],
    contra: { title: 'I understand Botox may not be safe for me if any of the following apply. Select any that apply to you.', options: list([
      'Allergy to any botulinum toxin product or ingredient', 'Infection at the injection site', 'Pregnant, breastfeeding or trying to become pregnant', 'Myasthenia gravis, Lambert-Eaton syndrome or ALS', 'Trouble swallowing or breathing', 'Taking aminoglycoside antibiotics or muscle relaxants', 'Bleeding disorder or taking blood thinners', 'Botulinum toxin injection in the last 3 months', 'Drooping eyelid or brow', 'Facial surgery or weakness in the facial muscles'
    ]) },
    acks: [
      { id: 'i_about', title: 'About Botox', paras: ['Botox Cosmetic (onabotulinumtoxinA) is a prescription medicine injected into facial muscles to temporarily soften certain lines. A licensed medical professional will examine me and decide whether it is appropriate for me. Results are temporary and usually last a few months, so repeat treatment is needed to maintain them. Some treatment areas may be off-label, and my provider will explain this.'] },
      { id: 'i_warning', title: 'Important safety warning', paras: ['<strong>The effects of botulinum toxin may spread from the injection site and cause serious symptoms hours to weeks after injection.</strong> These can include muscle weakness, double or blurred vision, drooping eyelids, trouble speaking, loss of bladder control, and trouble breathing or swallowing, which can be life-threatening. If I have any of these symptoms, I will get medical help right away.'] },
      { id: 'i_effects', title: 'Common side effects', paras: ['Possible side effects include pain, swelling, redness or bruising at the injection sites, headache, flu-like symptoms, drooping eyelid or brow, uneven results, dry eyes, and an unexpected facial expression. Most are temporary but may last until the treatment wears off.'] },
      { id: 'i_aftercare', title: 'Before and after treatment', paras: ['I have told my provider about all medicines, supplements and prior injections, because some can affect results or raise the risk of side effects. I will follow the aftercare instructions I am given. Because Botox can cause muscle weakness or vision changes, I will not drive or do anything risky if these occur.'] },
      noGuarantee('Botox')
    ],
    legal: legal('Botox treatment')
  };

  window.OXY_DRIPS = { hydration: 'Pure Hydration', energy: 'Daily Energy', immune: 'Immune Support', glow: 'Skin Glow', recovery: 'Active Recovery', calm: 'Deep Calm' };
  window.OXY_SERVICES = [hbot, iv, massage, infrared, venus, botox];
})();

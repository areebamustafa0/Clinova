// Editorial content for each treatment detail page (kept in code so the layout stays pixel-faithful).
// Price, duration and bookability still come from the database.
export type TreatmentContent = {
  tagline: string; intro: string; benefitsTitle: string; benefits: string[];
  steps: [string, string][]; faqTitle: string; faqs: [string, string][];
  ctaTitle: string; ctaText: string; imgs: { hero: string; benefit: string; cta: string };
};

export const TREATMENT_CONTENT: Record<string, TreatmentContent> = {
  "facial-treatments": {
    "tagline": "Dullness · Congestion · Dehydration",
    "intro": "Our signature facials combine deep cleansing, gentle exfoliation and targeted actives chosen for your skin on the day. Calm, clarifying and quietly transformative.",
    "benefitsTitle": "What you can expect to see",
    "benefits": [
      "Brighter, more even complexion",
      "Refined pores and smoother texture",
      "Deep, lasting hydration",
      "A calm reset for stressed skin"
    ],
    "steps": [
      [
        "Skin analysis",
        "We assess your skin under clinical light to choose the right actives."
      ],
      [
        "Cleanse & exfoliate",
        "A layered cleanse and gentle resurfacing prepare the skin."
      ],
      [
        "Targeted treatment",
        "Serums, masks or LED are tailored to your concerns."
      ],
      [
        "Aftercare",
        "You leave with a simple home routine to extend the results."
      ]
    ],
    "faqTitle": "Questions about facial treatments",
    "faqs": [
      [
        "How often should I have a facial?",
        "Every four to six weeks keeps pace with your skin's natural renewal cycle."
      ],
      [
        "Can I wear makeup afterwards?",
        "We recommend leaving skin bare for the rest of the day to let it breathe."
      ],
      [
        "Is it suitable for sensitive skin?",
        "Yes. Every facial is adapted to your skin on the day of treatment."
      ]
    ],
    "ctaTitle": "Ready to begin your treatment?",
    "ctaText": "Every plan starts with a consultation. We'll assess your skin and recommend only what you need.",
    "imgs": {
      "hero": "facial-treatment",
      "benefit": "skincare-ritual",
      "cta": "portrait-soft"
    }
  },
  "skin-rejuvenation": {
    "tagline": "Loss of radiance · Fine lines · Uneven tone",
    "intro": "Rejuvenation treatments stimulate your skin's own collagen and renewal, so results look like you on your best day. Subtle, gradual and natural.",
    "benefitsTitle": "What you can expect to see",
    "benefits": [
      "Firmer, more elastic skin",
      "Softened fine lines",
      "Renewed luminosity",
      "Results that build over time"
    ],
    "steps": [
      [
        "Consultation",
        "We map your goals and choose the right combination of therapies."
      ],
      [
        "Preparation",
        "Skin is cleansed and protected before treatment begins."
      ],
      [
        "Treatment",
        "LED, radiofrequency or microneedling, delivered with precision."
      ],
      [
        "Review",
        "We check progress at every visit and adjust your plan."
      ]
    ],
    "faqTitle": "Questions about skin rejuvenation",
    "faqs": [
      [
        "When will I see results?",
        "Many clients notice a glow within days, with collagen changes building over eight to twelve weeks."
      ],
      [
        "Does it hurt?",
        "Most treatments feel warm or lightly prickly. Numbing is available where needed."
      ],
      [
        "Can it be combined with other treatments?",
        "Yes. Rejuvenation pairs well with skin boosters and medical facials."
      ]
    ],
    "ctaTitle": "Ready to begin your treatment?",
    "ctaText": "Every plan starts with a consultation. We'll assess your skin and recommend only what you need.",
    "imgs": {
      "hero": "led-therapy",
      "benefit": "portrait-radiant",
      "cta": "glow-lips"
    }
  },
  "acne": {
    "tagline": "Active acne · Post-acne marks · Textural scarring",
    "intro": "Acne is medical, and it deserves a medical plan. We treat active breakouts first, then refine texture and scarring for smoother, calmer skin.",
    "benefitsTitle": "What you can expect to see",
    "benefits": [
      "Fewer, calmer breakouts",
      "Faded marks and redness",
      "Smoother skin texture",
      "A long-term maintenance routine"
    ],
    "steps": [
      [
        "Diagnosis",
        "A doctor identifies the type and triggers of your acne."
      ],
      [
        "Clear",
        "Peels, prescription care and light therapy settle active skin."
      ],
      [
        "Refine",
        "Microneedling or laser addresses residual scarring."
      ],
      [
        "Maintain",
        "A simple regime keeps skin clear between visits."
      ]
    ],
    "faqTitle": "Questions about acne & acne scarring",
    "faqs": [
      [
        "Will my acne come back?",
        "Acne can recur, which is why we build a maintenance plan with you from the start."
      ],
      [
        "Can scarring be treated while acne is active?",
        "We settle active breakouts first so scar treatments work more effectively."
      ],
      [
        "Is prescription care available?",
        "Yes. Our doctors can prescribe where clinically appropriate."
      ]
    ],
    "ctaTitle": "Ready to begin your treatment?",
    "ctaText": "Every plan starts with a consultation. We'll assess your skin and recommend only what you need.",
    "imgs": {
      "hero": "result-texture",
      "benefit": "consultation-analysis",
      "cta": "portrait-natural"
    }
  },
  "pigmentation": {
    "tagline": "Sun spots · Melasma · Post-inflammatory marks",
    "intro": "Pigmentation needs a careful, layered approach. We combine light-based treatments, peels and daily protection to restore an even, clear tone.",
    "benefitsTitle": "What you can expect to see",
    "benefits": [
      "A clearer, more even tone",
      "Reduced sun spots and patches",
      "Brighter overall complexion",
      "Protection strategies that last"
    ],
    "steps": [
      [
        "Assessment",
        "We identify the depth and type of pigment before treating."
      ],
      [
        "Prepare",
        "Your skin may be primed with a short home regime."
      ],
      [
        "Treat",
        "IPL, laser or peels are selected for your skin type."
      ],
      [
        "Protect",
        "Daily SPF and maintenance keep pigment from returning."
      ]
    ],
    "faqTitle": "Questions about pigmentation",
    "faqs": [
      [
        "Is it safe for darker skin tones?",
        "Yes, with the right technology and settings. Every plan is tailored to your skin type."
      ],
      [
        "Will the spots darken first?",
        "Treated spots often darken slightly before flaking away over one to two weeks."
      ],
      [
        "Can melasma be cured?",
        "Melasma can be managed very effectively, though it needs ongoing care."
      ]
    ],
    "ctaTitle": "Ready to begin your treatment?",
    "ctaText": "Every plan starts with a consultation. We'll assess your skin and recommend only what you need.",
    "imgs": {
      "hero": "ipl-laser",
      "benefit": "skincare-ritual",
      "cta": "portrait-soft"
    }
  },
  "laser-treatments": {
    "tagline": "Texture · Redness & vessels · Fine lines",
    "intro": "Our medical-grade lasers target specific concerns with exceptional precision. Every setting is calibrated to your skin, for results that look refined, never overdone.",
    "benefitsTitle": "What you can expect to see",
    "benefits": [
      "Smoother, refined texture",
      "Reduced redness and visible vessels",
      "Tighter-looking skin",
      "Long-lasting collagen renewal"
    ],
    "steps": [
      [
        "Consultation",
        "We confirm suitability and choose the right laser for you."
      ],
      [
        "Patch test",
        "A small test ensures your skin responds as expected."
      ],
      [
        "Treatment",
        "Eyes are protected and the laser is applied in precise passes."
      ],
      [
        "Recovery",
        "Clear aftercare guidance supports fast, comfortable healing."
      ]
    ],
    "faqTitle": "Questions about laser treatments",
    "faqs": [
      [
        "Does laser treatment hurt?",
        "Most clients describe a warm snapping sensation. Cooling and numbing keep you comfortable."
      ],
      [
        "How many sessions will I need?",
        "It depends on the concern. Your doctor will outline a clear plan at consultation."
      ],
      [
        "Can I have laser in summer?",
        "Some lasers are suitable year-round. We'll advise based on your treatment and sun exposure."
      ]
    ],
    "ctaTitle": "Ready to begin your treatment?",
    "ctaText": "Every plan starts with a consultation. We'll assess your skin and recommend only what you need.",
    "imgs": {
      "hero": "laser-resurfacing",
      "benefit": "ipl-laser",
      "cta": "consultation-screen"
    }
  },
  "anti-aging": {
    "tagline": "Expression lines · Volume loss · Skin laxity",
    "intro": "Refreshed, not changed. We use a considered combination of treatments to soften lines and support structure, so you look rested and like yourself.",
    "benefitsTitle": "What you can expect to see",
    "benefits": [
      "Softened expression lines",
      "Restored facial balance",
      "A fresher, rested look",
      "Natural movement preserved"
    ],
    "steps": [
      [
        "Facial assessment",
        "We study your features at rest and in motion."
      ],
      [
        "Your plan",
        "A phased plan prioritizes what will make the biggest difference."
      ],
      [
        "Treatment",
        "Precise, conservative placement for a natural outcome."
      ],
      [
        "Two-week review",
        "We check results and fine-tune if needed."
      ]
    ],
    "faqTitle": "Questions about anti-aging",
    "faqs": [
      [
        "Will I still look like me?",
        "Always. Our approach is conservative and focused on natural expression."
      ],
      [
        "How long do results last?",
        "Typically three to twelve months, depending on the treatment."
      ],
      [
        "When should I start?",
        "There's no set age. We'll advise on prevention or correction based on your skin."
      ]
    ],
    "ctaTitle": "Ready to begin your treatment?",
    "ctaText": "Every plan starts with a consultation. We'll assess your skin and recommend only what you need.",
    "imgs": {
      "hero": "profiles-layered",
      "benefit": "profiles-layered",
      "cta": "portrait-sleek"
    }
  },
  "injectables": {
    "tagline": "Lines & wrinkles · Lip definition · Facial contour",
    "intro": "Injectables in expert hands are about balance, not volume. Our doctors enhance your natural features with precision and restraint.",
    "benefitsTitle": "What you can expect to see",
    "benefits": [
      "Smoother lines at rest",
      "Subtle definition and contour",
      "Immediate, natural-looking results",
      "Performed only by medical professionals"
    ],
    "steps": [
      [
        "Consultation",
        "We discuss goals, anatomy and medical history in depth."
      ],
      [
        "Mapping",
        "Treatment points are planned around your facial proportions."
      ],
      [
        "Treatment",
        "Fine needles and numbing keep you comfortable throughout."
      ],
      [
        "Follow-up",
        "A complimentary review at two weeks for peace of mind."
      ]
    ],
    "faqTitle": "Questions about injectables",
    "faqs": [
      [
        "Who performs the treatment?",
        "Injectables are performed only by our qualified medical practitioners."
      ],
      [
        "Is there bruising?",
        "Mild, temporary bruising can occur. We'll share tips to minimize it."
      ],
      [
        "Can filler be reversed?",
        "Hyaluronic acid fillers can be dissolved if ever needed."
      ]
    ],
    "ctaTitle": "Ready to begin your treatment?",
    "ctaText": "Every plan starts with a consultation. We'll assess your skin and recommend only what you need.",
    "imgs": {
      "hero": "injectables",
      "benefit": "lip-enhancement",
      "cta": "profile-sculpt"
    }
  },
  "skin-boosters": {
    "tagline": "Dehydration · Crepey texture · Dull skin",
    "intro": "Skin boosters deliver hyaluronic acid deep into the skin, improving hydration, elasticity and glow from within. A beautiful treatment for tired or dehydrated skin.",
    "benefitsTitle": "What you can expect to see",
    "benefits": [
      "Deep, long-lasting hydration",
      "Improved elasticity",
      "Smoother, dewier texture",
      "A natural, lit-from-within glow"
    ],
    "steps": [
      [
        "Consultation",
        "We confirm boosters are right for your skin and goals."
      ],
      [
        "Numbing",
        "A topical anesthetic keeps the treatment comfortable."
      ],
      [
        "Treatment",
        "Micro-injections distribute hydration evenly across the area."
      ],
      [
        "Glow",
        "Small bumps settle within a day or two, revealing plumper skin."
      ]
    ],
    "faqTitle": "Questions about skin boosters",
    "faqs": [
      [
        "How long do results last?",
        "Around six months after an initial course, with maintenance every six to nine months."
      ],
      [
        "Where can boosters be used?",
        "Face, neck, dÃ©colletage and the backs of the hands."
      ],
      [
        "Is it the same as filler?",
        "No. Boosters hydrate and improve skin quality rather than add volume."
      ]
    ],
    "ctaTitle": "Ready to begin your treatment?",
    "ctaText": "Every plan starts with a consultation. We'll assess your skin and recommend only what you need.",
    "imgs": {
      "hero": "skin-boosters",
      "benefit": "glow-lips",
      "cta": "portrait-waves"
    }
  }
};

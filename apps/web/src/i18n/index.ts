export const supportedLocales = ["en", "hi"] as const;

export type Locale = (typeof supportedLocales)[number];

type Dictionary = {
  landing: {
    name: string;
    tagline: string;
    prototypeNotice: string;
    independenceNotice: string;
  };
};

export const dictionaries = {
  en: {
    landing: {
      name: "RaahSathi",
      tagline: "Reliable digital driving-licence services.",
      prototypeNotice: "Hackathon prototype using synthetic data.",
      independenceNotice: "Not an official government service.",
    },
  },
  hi: {
    landing: {
      name: "राहसाथी",
      tagline: "भरोसेमंद डिजिटल ड्राइविंग-लाइसेंस सेवाएँ।",
      prototypeNotice: "यह कृत्रिम डेटा का उपयोग करने वाला हैकाथॉन प्रोटोटाइप है।",
      independenceNotice: "यह कोई आधिकारिक सरकारी सेवा नहीं है।",
    },
  },
} satisfies Record<Locale, Dictionary>;

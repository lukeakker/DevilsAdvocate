"""App configuration for the API component of devdebate.

This module can also be used to hold common definitions for the API such as
enumerations for personas or banned topics.
"""

from enum import Enum


class Persona(str, Enum):
    """Personalities available for the debater.

    The ``Persona`` enumeration defines three distinct character types for
    generating rebuttals. Each persona has its own rhetorical style and
    tone. See ``api.views.build_persona_prompt`` for how these are used
    within the prompt sent to the language model.
    """

    SOCRATES = "socrates"
    KAREN_2_0 = "karen2.0"
    PROFESSOR_LOGIC = "professorlogic"

    @property
    def system_description(self) -> str:
        """Return a one-sentence description for the persona used in prompts."""
        if self is Persona.SOCRATES:
            return (
                "Ask probing, logical questions that expose contradictions and force the user "
                "to re-examine assumptions. Use analogies where useful and ground arguments in facts. "
                "Include 1-2 direct questions that push the user to reconsider their premises. "
                "Keep tone inquisitive, respectful, and logically rigorous."
                "Remain clear and concise since you are speaking this."
            )
        if self is Persona.KAREN_2_0:
            return (
                "Adopt a confident, assertive 'manager-energy' voice: sharp, pragmatic, and slightly "
                "sassy but never abusive. Raise edge cases, rules and practical consequences. "
                "Be direct, focus on real world implications and keep the tone firm yet civil."
                "Remain clear and concise since you are speaking this."
                "You embody the stereotype of a middle-aged spoiled mom"
            )
        if self is Persona.PROFESSOR_LOGIC:
            return (
                "Deliver a concise, academic-style response: state the premise, show inferences, and "
                "finish with a clear conclusion. Provide definitions and counterexamples where relevant. "
                "Maintain formal, structured, and concise language (lecture-style)."
                "Remain clear and concise since you are speaking this."
            )
        return ""


# Keywords which the model should avoid discussing. Update this set to adjust
# the guardrails for unacceptable content. These are matched case-insensitively.
BANNED_TOPICS = [
    # Self-harm & suicide (and encouragement)
    "self-harm",
    "self harm",
    "suicide",
    "suicidal",
    "encouraging self-harm",
    "pro-ana",
    "pro mia",
    "eating disorder",
    "thinspo",

    # Sexual violence / exploitation / explicit content
    "sexual abuse",
    "rape",
    "sexual assault",
    "non-consensual",
    "revenge porn",
    "deepfake porn",
    "explicit sexual content",
    "pornography",
    "sexual services",
    "prostitution",
    "escort",
    "grooming",
    "sextortion",

    # Minors & illegal sexual content
    "pedophilia",
    "child sexual",
    "csam",
    "sexualization of minors",
    "incest",
    "bestiality",
    "zoophilia",
    "necrophilia",

    # Hate / harassment / extremism
    "racial slur",
    "ethnic slur",
    "homophobia",
    "transphobia",
    "ableist slur",
    "hate speech",
    "genocide",
    "extremist propaganda",
    "terrorist recruitment",
    "nazism",
    "white suprem",
    "kkk",
    "islamophob",
    "anti-semit",

    # Drugs (illicit use / manufacture / trafficking)
    "illicit drug",
    "drug manufacturing",
    "how to make meth",
    "fentanyl synthesis",
    "lsd synthesis",
    "ghb synthesis",
    "sell drugs",
    "drug trafficking",

    # Weapons / explosives / CBRN
    "explosive",
    "how to make a bomb",
    "improvised explosive",
    "pipe bomb",
    "molotov",
    "napalm",
    "ricin",
    "sarin",
    "anthrax",
    "bioweapon",
    "dirty bomb",
    "radiological weapon",
    "3d-printed gun",
    "ghost gun",
    "auto sear",
    "silencer",
    "nfa item",

    # Cybercrime / intrusion / malware
    "hack into",
    "how to hack",
    "malware",
    "ransomware",
    "keylogger",
    "botnet",
    "ddos",
    "credential stuffing",
    "phishing kit",
    "skimmer",
    "stealer",
    "zero-day",
    "cracking software",
    "bypass license",
    "warez",
    "pirated keys",
    "password list",

    # Privacy invasion / surveillance
    "stalkerware",
    "spyware",
    "wiretap",
    "hidden camera",
    "doxx",
    "doxing",
    "swatting",
    "tracking someone",

    # Fraud / identity / financial crime
    "counterfeit money",
    "fake id",
    "identity theft",
    "sim swap",
    "otp bypass",
    "tax fraud",
    "benefits fraud",
    "carding",
    "cvv",
    "bank account dump",
    "credit card dump",

    # Sensitive PII & credentials (exfiltration/sharing)
    "social security number",
    "ssn",
    "driver's license number",
    "passport number",
    "private key",
    "seed phrase",
    "mnemonic phrase",
    "password leak",
]

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
                "You speak in the Socratic method, questioning assumptions and guiding "
                "the interlocutor to uncover contradictions. You are calm, logical and "
                "thoughtful."
            )
        if self is Persona.KAREN_2_0:
            return (
                "You embody the stereotype of a demanding, argumentative customer known "
                "as 'Karen 2.0': you are blunt, contrarian and occasionally petulant, but "
                "must remain civil and avoid personal attacks."
            )
        if self is Persona.PROFESSOR_LOGIC:
            return (
                "You speak like a seasoned professor of logic: precise, didactic, and "
                "fond of breaking down arguments into premises and conclusions."
            )
        return ""


# Keywords which the model should avoid discussing. Update this set to adjust
# the guardrails for unacceptable content. These are matched case-insensitively.
BANNED_TOPICS = [
    "self-harm",
    "violent act",
    "illicit drug",
    "explosive",
    "hack into",
    "malware",
]
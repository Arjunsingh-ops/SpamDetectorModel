"""Active Voice Session Manager."""

import logging
from typing import Dict, Any, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from app.ai.audio.pipeline import AudioPipeline
from app.services.conversation_summary import conversation_summary_service

logger = logging.getLogger("ai_call_agent.services.voice_session")


class VoiceSessionManager:
    """Orchestrates active AI voice pipelines and synchronizes transcripts & summaries."""

    def __init__(self):
        self._active_pipelines: Dict[str, AudioPipeline] = {}

    def get_or_create_pipeline(self, call_id: str) -> AudioPipeline:
        if call_id not in self._active_pipelines:
            self._active_pipelines[call_id] = AudioPipeline(call_id=call_id)
        return self._active_pipelines[call_id]

    async def end_session(self, db: Session, call_id: UUID) -> Optional[Dict[str, Any]]:
        call_str = str(call_id)
        pipeline = self._active_pipelines.get(call_str)
        extracted_slots = pipeline.memory.extracted_slots if pipeline else {}

        # Generate final call summary
        conv = await conversation_summary_service.generate_and_persist_summary(
            db=db,
            call_id=call_id,
            extracted_slots=extracted_slots,
        )

        if call_str in self._active_pipelines:
            del self._active_pipelines[call_str]

        logger.info(f"Terminated voice session and persisted summary for call_id={call_id}")
        return {
            "summary": conv.summary if conv else "",
            "extracted_slots": extracted_slots,
        }


voice_session_manager = VoiceSessionManager()

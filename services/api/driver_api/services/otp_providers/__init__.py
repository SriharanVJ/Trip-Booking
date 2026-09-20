"""SMS delivery backends for OTP.

`otp_service.SMSProvider` is the mock (log-only) provider used in dev; the
Twilio Verify provider here sends real SMS and owns the code lifecycle
(Twilio generates and validates the code — nothing is stored locally).
"""

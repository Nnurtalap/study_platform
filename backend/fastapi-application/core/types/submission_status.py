import enum

class SubmissionStatus(str, enum.Enum):
    PENDING = "pending"
    GRADED = "graded"
    FAILED = "failed"


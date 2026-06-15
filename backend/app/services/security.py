from typing import List, Optional, Dict, Any
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
import hashlib
import secrets
import pyotp


class WarningType(str, Enum):
    TAB_SWITCH = "tab_switch"
    MULTIPLE_FACES = "multiple_faces"
    AUDIO_ANOMALY = "audio_anomaly"
    COPY_PASTE = "copy_paste"
    DEV_TOOLS = "dev_tools"
    BROWSER_INTEGRITY = "browser_integrity"


@dataclass
class SecurityWarning:
    """Security warning event"""
    warning_type: WarningType
    timestamp: float
    message: str
    severity: str  # "low", "medium", "high", "critical"
    metadata: Dict[str, Any]


@dataclass
class AntiCheatReport:
    """Anti-cheat monitoring report"""
    interview_id: str
    total_warnings: int
    warnings_by_type: Dict[str, int]
    warning_severity: Dict[str, str]
    integrity_score: float
    flags: List[str]
    included_in_report: bool


class AntiCheatMonitor:
    """
    Anti-cheat monitoring for interview sessions.
    """
    
    def __init__(self, interview_id: str):
        self.interview_id = interview_id
        self.warnings: List[SecurityWarning] = []
        self._tab_switch_count = 0
        self._tab_switch_timestamps: List[float] = []
        self._face_detection_enabled = True
        self._audio_analysis_enabled = True
    
    def record_tab_switch(self, timestamp: float, duration: float = 0):
        """Record a tab switch event"""
        self._tab_switch_count += 1
        self._tab_switch_timestamps.append(timestamp)
        
        # Determine severity
        severity = "low"
        message = "Tab switch detected"
        
        if duration > 30:
            severity = "high"
            message = "Extended tab switch detected (>30s)"
        elif duration > 10:
            severity = "medium"
            message = "Tab switch duration significant (>10s)"
        
        # Add warning
        self.warnings.append(SecurityWarning(
            warning_type=WarningType.TAB_SWITCH,
            timestamp=timestamp,
            message=message,
            severity=severity,
            metadata={"duration": duration, "count": self._tab_switch_count}
        ))
        
        return severity
    
    def record_multiple_faces(self, timestamp: float, face_count: int):
        """Record multiple faces detected"""
        severity = "critical" if face_count > 2 else "high"
        
        self.warnings.append(SecurityWarning(
            warning_type=WarningType.MULTIPLE_FACES,
            timestamp=timestamp,
            message=f"Multiple faces detected: {face_count}",
            severity=severity,
            metadata={"face_count": face_count}
        ))
        
        return severity
    
    def record_audio_anomaly(self, timestamp: float, anomaly_type: str):
        """Record audio anomaly (AI-generated speech detection, etc.)"""
        severity = "medium"  # Default to medium for audio anomalies
        
        self.warnings.append(SecurityWarning(
            warning_type=WarningType.AUDIO_ANOMALY,
            timestamp=timestamp,
            message=f"Audio anomaly detected: {anomaly_type}",
            severity=severity,
            metadata={"anomaly_type": anomaly_type}
        ))
        
        return severity
    
    def record_browser_integrity_check(self, timestamp: float, passed: bool, details: Dict[str, Any]):
        """Record browser integrity check result"""
        severity = "low" if passed else "critical"
        message = "Browser integrity check passed" if passed else "Browser integrity check failed"
        
        self.warnings.append(SecurityWarning(
            warning_type=WarningType.BROWSER_INTEGRITY,
            timestamp=timestamp,
            message=message,
            severity=severity,
            metadata=details
        ))
        
        return severity
    
    def generate_report(self) -> AntiCheatReport:
        """Generate anti-cheat report for the interview"""
        
        warnings_by_type: Dict[str, int] = {}
        warning_severity: Dict[str, str] = {}
        
        for warning in self.warnings:
            wt = warning.warning_type.value
            warnings_by_type[wt] = warnings_by_type.get(wt, 0) + 1
            # Keep highest severity
            severity_order = {"low": 0, "medium": 1, "high": 2, "critical": 3}
            if wt not in warning_severity or \
               severity_order.get(warning.severity, 0) > severity_order.get(warning_severity.get(wt, ""), -1):
                warning_severity[wt] = warning.severity
        
        # Calculate integrity score
        integrity_score = self._calculate_integrity_score()
        
        # Determine flags
        flags = self._determine_flags()
        
        # Should include in report?
        included_in_report = self._should_include_in_report()
        
        return AntiCheatReport(
            interview_id=self.interview_id,
            total_warnings=len(self.warnings),
            warnings_by_type=warnings_by_type,
            warning_severity=warning_severity,
            integrity_score=integrity_score,
            flags=flags,
            included_in_report=included_in_report
        )
    
    def _calculate_integrity_score(self) -> float:
        """Calculate overall integrity score (0-1)"""
        score = 1.0
        
        # Deduct for each warning based on severity
        for warning in self.warnings:
            if warning.severity == "critical":
                score -= 0.2
            elif warning.severity == "high":
                score -= 0.1
            elif warning.severity == "medium":
                score -= 0.05
            else:
                score -= 0.02
        
        return max(0.0, min(1.0, score))
    
    def _determine_flags(self) -> List[str]:
        """Determine warning flags"""
        flags = []
        
        # Critical flags
        if self._tab_switch_count > 5:
            flags.append("EXCESSIVE_TAB_SWITCHES")
        
        if any(w for w in self.warnings if w.severity == "critical"):
            flags.append("CRITICAL_WARNING_DETECTED")
        
        # Check for multiple faces
        face_warnings = [w for w in self.warnings if w.warning_type == WarningType.MULTIPLE_FACES]
        if face_warnings:
            flags.append("MULTIPLE_FACES_DETECTED")
        
        # Check for AI speech
        audio_warnings = [w for w in self.warnings if w.warning_type == WarningType.AUDIO_ANOMALY]
        if audio_warnings:
            flags.append("AUDIO_ANOMALY_DETECTED")
        
        # Check for browser integrity failures
        integrity_warnings = [w for w in self.warnings if w.warning_type == WarningType.BROWSER_INTEGRITY and w.severity == "critical"]
        if integrity_warnings:
            flags.append("BROWSER_INTEGRITY_FAILED")
        
        return flags
    
    def _should_include_in_report(self) -> bool:
        """Determine if warnings should be included in candidate report"""
        # Include if any critical or high severity warnings
        high_severity = [w for w in self.warnings if w.severity in ("critical", "high")]
        return len(high_severity) > 0


class AuditLogger:
    """
    Audit logging for security events and data access.
    """
    
    def __init__(self):
        self.logs: List[Dict[str, Any]] = []
    
    def log(
        self,
        user_id: Optional[str],
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        """Log an audit event"""
        
        log_entry = {
            "id": secrets.token_urlsafe(16),
            "user_id": user_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "metadata": metadata or {},
            "timestamp": datetime.utcnow().isoformat()
        }
        
        self.logs.append(log_entry)
        
        # In production, this would write to a secure, immutable log storage
        return log_entry["id"]
    
    def get_logs(
        self,
        user_id: Optional[str] = None,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Query audit logs with filters"""
        
        results = self.logs
        
        if user_id:
            results = [r for r in results if r.get("user_id") == user_id]
        
        if action:
            results = [r for r in results if r.get("action") == action]
        
        if resource_type:
            results = [r for r in results if r.get("resource_type") == resource_type]
        
        if start_date:
            results = [r for r in results if datetime.fromisoformat(r["timestamp"]) >= start_date]
        
        if end_date:
            results = [r for r in results if datetime.fromisoformat(r["timestamp"]) <= end_date]
        
        return results[-limit:]


class DataEncryption:
    """
    Data encryption utilities for sensitive data protection.
    """
    
    @staticmethod
    def hash_password(password: str, salt: Optional[str] = None) -> tuple:
        """Hash a password using PBKDF2"""
        if salt is None:
            salt = secrets.token_hex(32)
        
        key = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        )
        
        return key.hex(), salt
    
    @staticmethod
    def verify_password(password: str, hashed: str, salt: str) -> bool:
        """Verify a password against its hash"""
        computed_hash, _ = DataEncryption.hash_password(password, salt)
        return computed_hash == hashed
    
    @staticmethod
    def generate_otp_secret() -> str:
        """Generate a secret for OTP"""
        return pyotp.random_base32()
    
    @staticmethod
    def generate_otp(secret: str) -> str:
        """Generate current OTP from secret"""
        totp = pyotp.TOTP(secret)
        return totp.now()
    
    @staticmethod
    def verify_otp(secret: str, token: str, valid_window: int = 1) -> bool:
        """Verify OTP token"""
        totp = pyotp.TOTP(secret)
        return totp.verify(token, valid_window=valid_window)


class AccessControl:
    """
    Role-based access control implementation.
    """
    
    PERMISSIONS = {
        "admin": [
            "users:read", "users:write", "users:delete",
            "candidates:read", "candidates:write", "candidates:delete",
            "interviews:read", "interviews:write", "interviews:delete",
            "reports:read", "reports:write",
            "settings:read", "settings:write"
        ],
        "recruiter": [
            "candidates:read", "candidates:write",
            "interviews:read", "interviews:write",
            "reports:read"
        ],
        "hiring_manager": [
            "candidates:read",
            "interviews:read",
            "reports:read"
        ],
        "candidate": [
            "interviews:read:own",
            "profile:read", "profile:write"
        ]
    }
    
    @classmethod
    def has_permission(cls, role: str, permission: str) -> bool:
        """Check if a role has a specific permission"""
        role_permissions = cls.PERMISSIONS.get(role, [])
        return permission in role_permissions or "*" in role_permissions
    
    @classmethod
    def get_permissions(cls, role: str) -> List[str]:
        """Get all permissions for a role"""
        return cls.PERMISSIONS.get(role, [])
    
    @classmethod
    def require_permission(cls, role: str, permission: str):
        """Decorator to enforce permission"""
        def decorator(func):
            def wrapper(*args, **kwargs):
                if not cls.has_permission(role, permission):
                    raise PermissionError(f"Role '{role}' does not have permission '{permission}'")
                return func(*args, **kwargs)
            return wrapper
        return decorator

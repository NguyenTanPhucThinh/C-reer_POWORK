#!/usr/bin/env python3
import os

base = r"D:\HCMUS\C-reer_POWORK\Frontend"

replacements = {
    "components/profile/ProfessionalSummary.tsx": [
        ("Professional summary", "Tóm tắt chuyên môn"),
        ("Career signal at a glance", "Tín hiệu sự nghiệp của bạn"),
    ],
    "components/profile/EvidenceHighlights.tsx": [
        ("Project showcases", "Dự án tiêu biểu"),
        ("Verified score", "Điểm đã xác thực"),
        ("View showcase", "Xem chi tiết"),
    ],
    "components/profile/EvidenceTimeline.tsx": [
        ("Career history", "Lịch sử sự nghiệp"),
        ("A chronological record of completed challenges, verified skills, and reviewed work",
         "Lịch sử challenge đã hoàn thành, kỹ năng đã xác thực và bài làm đã chấm"),
    ],
    "components/profile/EvidenceTimelineItem.tsx": [
        ("Challenge completed", "Challenge đã hoàn thành"),
        ("Career signal", "Tín hiệu sự nghiệp"),
        ("Open event", "Xem chi tiết"),
    ],
    "components/profile/ProfileOverviewSidebar.tsx": [
        ("Recruiter snapshot", "Thông tin nhanh cho Nhà tuyển dụng"),
        ("Quick overview", "Tóm tắt nhanh"),
        ("Profile unlocked by verified performance",
         "Hồ sơ được mở khóa nhờ bằng chứng đã xác thực"),
        ("Strong fit for interview", "Phù hợp để phỏng vấn"),
        ("Review the top evidence before outreach",
         "Xem bằng chứng hàng đầu trước khi liên hệ"),
        ("Average score is", "Điểm trung bình là"),
        ("across", "trong"),
        ("passed challenges", "challenge đã vượt"),
        ("Available on request", "Cung cấp khi yêu cầu"),
        ("Candidate has not provided this yet", "Ứng viên chưa cung cấp"),
        ("Available after candidate update", "Có sẵn sau khi cập nhật"),
        ("Contact", "Liên hệ"),
        ("Role fit", "Vị trí phù hợp"),
        ("Education", "Học vấn"),
        ("Availability", "Tình trạng"),
        ("Links", "Liên kết"),
    ],
    "components/profile/SkillsRubricSummary.tsx": [
        ("Verified capabilities", "Năng lực đã xác thực"),
        ("Skill chips, current levels, and verified challenge signals",
         "Các kỹ năng, cấp độ hiện tại và tín hiệu challenge đã xác thực"),
    ],
    "components/profile/ProfileStatsCards.tsx": [
        ("label: 'Total Challenges'", "label: 'Tổng Challenge'"),
        ("label: 'Passed Challenges'", "label: 'Challenge đã vượt'"),
        ("label: 'Average Score'", "label: 'Điểm trung bình'"),
        ("label: 'Verified Skills'", "label: 'Kỹ năng đã xác thực'"),
        ("Completed evidence", "Bằng chứng đã hoàn thành"),
        ("Rubric-backed signals", "Tín hiệu theo rubric"),
        ("Reviewed by employers", "Đánh giá bởi nhà tuyển dụng"),
        ("Across verified work", "Trên công việc đã xác thực"),
    ],
    "components/profile/RubricScoreBreakdown.tsx": [
        ("Chưa có rubric breakdown cho evidence này",
         "Chưa có chi tiết rubric cho bằng chứng này"),
        ("Weight", "Trọng số"),
    ],
    "components/profile/ProfileNavigationTabs.tsx": [
        ("Timeline", "Dòng thời gian"),
        ("Evidence", "Bằng chứng"),
        ("Projects", "Dự án"),
        ("Achievements", "Thành tích"),
        ("Activity", "Hoạt động"),
        ("Statistics", "Thống kê"),
        ("Bookmarks", "Đã lưu"),
        ("Saved Challenges", "Challenge đã lưu"),
    ],
    "components/submissions/SubmissionHistory.tsx": [
        ("Thử lại", "Thử lại"),
    ],
    "components/talent-pool/TalentPoolEmptyState.tsx": [
        ("Mở khóa ứng viên từ các bài chấm thử thách thành công để tích lũy nguồn nhân tài chất lượng cao",
         "Mở khóa ứng viên từ bài chấm thử thách để thêm vào Talent Pool"),
    ],
}

for rel, reps in replacements.items():
    fpath = os.path.join(base, rel)
    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()
    orig = content
    for old, new in reps:
        if old in content:
            content = content.replace(old, new)
            print(f"  OK: {rel}: '{old[:50]}' -> '{new[:50]}'")
        else:
            print(f"  SKIP: {rel}: '{old[:50]}' not found")
    if content != orig:
        with open(fpath, "w", encoding="utf-8") as f:
            f.write(content)

print("Done")

#!/bin/bash
cd "D:/HCMUS/C-reer_POWORK/Frontend"

translate() {
  local file="$1"
  local old="$2"
  local new="$3"
  if grep -qF "$old" "$file" 2>/dev/null; then
    sed -i "s|$old|$new|g" "$file"
    echo "  OK: $file: '$old' -> '$new'"
  fi
}

translate components/profile/ProfessionalSummary.tsx "Professional summary" "Tóm tắt chuyên môn"
translate components/profile/ProfessionalSummary.tsx "Career signal at a glance" "Tín hiệu sự nghiệp của bạn"
translate components/profile/EvidenceHighlights.tsx "Project showcases" "Dự án tiêu biểu"
translate components/profile/EvidenceTimeline.tsx "Career history" "Lịch sử sự nghiệp"
translate components/profile/EvidenceTimelineItem.tsx "Challenge completed" "Challenge đã hoàn thành"
translate components/profile/EvidenceTimelineItem.tsx "Career signal" "Tín hiệu sự nghiệp"
translate components/profile/ProfileOverviewSidebar.tsx "Recruiter snapshot" "Thông tin nhanh cho Nhà tuyển dụng"
translate components/profile/ProfileOverviewSidebar.tsx "Quick overview" "Tóm tắt nhanh"
translate components/profile/ProfileOverviewSidebar.tsx "Profile unlocked by verified performance" "Hồ sơ được mở khóa nhờ bằng chứng đã xác thực"
translate components/profile/ProfileOverviewSidebar.tsx "Strong fit for interview" "Phù hợp để phỏng vấn"
translate components/profile/ProfileOverviewSidebar.tsx "Review the top evidence before outreach" "Đánh giá bằng chứng hàng đầu trước khi liên hệ"
translate components/profile/ProfileOverviewSidebar.tsx "Available on request" "Cung cấp khi yêu cầu"
translate components/profile/ProfileOverviewSidebar.tsx "Candidate has not provided this yet" "Ứng viên chưa cung cấp"
translate components/profile/ProfileOverviewSidebar.tsx "Available after candidate update" "Có sẵn sau khi ứng viên cập nhật"
translate components/profile/SkillsRubricSummary.tsx "Verified capabilities" "Năng lực đã xác thực"
translate components/profile/SkillsRubricSummary.tsx "Skill chips, current levels, and verified challenge signals" "Các chip kỹ năng, cấp độ hiện tại và tín hiệu challenge đã xác thực"
translate components/profile/RubricScoreBreakdown.tsx "Chưa có rubric breakdown cho evidence này" "Chưa có chi tiết rubric cho bằng chứng này"
translate components/profile/RubricScoreBreakdown.tsx "Weight" "Trọng số"
translate components/profile/ProfileStatsCards.tsx "label: 'Total Challenges'" "label: 'Tổng Challenge'"
translate components/profile/ProfileStatsCards.tsx "label: 'Passed Challenges'" "label: 'Challenge đã vượt'"
translate components/profile/ProfileStatsCards.tsx "label: 'Average Score'" "label: 'Điểm trung bình'"
translate components/profile/ProfileStatsCards.tsx "label: 'Verified Skills'" "label: 'Kỹ năng đã xác thực'"
translate components/profile/ProfileStatsCards.tsx "Completed evidence" "Bằng chứng đã hoàn thành"
translate components/profile/ProfileStatsCards.tsx "Rubric-backed signals" "Tín hiệu theo rubric"
translate components/profile/ProfileStatsCards.tsx "Reviewed by employers" "Đánh giá bởi nhà tuyển dụng"
translate components/profile/ProfileStatsCards.tsx "Across verified work" "Trên công việc đã xác thực"

echo "--- Done ---"

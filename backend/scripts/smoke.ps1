# End-to-end smoke test against the local backend.
# Usage: $env:ADMIN_PASSWORD='...'; powershell -File scripts/smoke.ps1   (admin mobile defaults to 01799999999)
$ErrorActionPreference = 'Stop'
if (-not $env:ADMIN_PASSWORD) { throw 'Set ADMIN_PASSWORD (the local administrator password) before running.' }
$adminMobile = if ($env:ADMIN_MOBILE) { $env:ADMIN_MOBILE } else { '01799999999' }
$base = 'http://127.0.0.1:3001/api'
$device = 'smoke-device-0001'
function Call($method, $path, $body, $token, $extra = @{}) {
  $headers = @{ 'X-Device-Id' = $device } + $extra
  if ($token) { $headers.Authorization = "Bearer $token" }
  $params = @{ Method = $method; Uri = "$base$path"; Headers = $headers; ContentType = 'application/json' }
  if ($null -ne $body) { $params.Body = ($body | ConvertTo-Json -Depth 10) }
  try { Invoke-RestMethod @params } catch { $r = $_.Exception.Response; $s = New-Object IO.StreamReader($r.GetResponseStream()); throw "$method $path -> $([int]$r.StatusCode) $($s.ReadToEnd())" }
}

$admin = Call POST '/auth/login' @{ mobile = $adminMobile; password = $env:ADMIN_PASSWORD }
"admin ok: $($admin.user.fullName) role=$($admin.user.role)"
$t = $admin.accessToken

$slug = "smoke-course-$((Get-Date).ToString('HHmmss'))"
$course = Call POST '/admin/courses' @{ slug = $slug; title = 'Smoke FCPS Batch'; category = 'FCPS'; price = 1000; discountPrice = 800; batchGroup = 'fcps-p1-medicine'; classTime = @{ start = '20:00'; end = '22:00' }; classDays = @('sat','tue'); isPublished = $true; highlights = @('Weekly exams'); description = 'Smoke course.' } $t
"course: $($course.id) status=$($course.status)"
$video = Call POST '/admin/videos' @{ courseId = $course.id; title = 'Orientation'; src = 'https://media.example.test/v.mp4'; scheduledAt = (Get-Date).AddDays(-1).ToUniversalTime().ToString('o'); durationMinutes = 75; status = 'published' } $t
"video: $($video.duration) at $($video.scheduledDate) $($video.scheduledTime)"
$exam = Call POST '/admin/exams' @{ courseId = $course.id; title = 'Smoke Paper'; durationMinutes = 20; scheduledAt = (Get-Date).AddDays(-1).ToUniversalTime().ToString('o'); targetQuestionCount = 1; marksPerQuestion = 1; negativeMarking = 0; isPublished = $true; questions = @(@{ id = 'q1'; type = 'sba'; stem = 'Pick B'; options = @(@{ id = 'a'; text = 'A' }, @{ id = 'b'; text = 'B' }); correctAnswer = 'b'; marks = 1 }) } $t
"exam: $($exam.id) status=$($exam.status)"
$row = Call POST '/admin/schedules' @{ courseId = $course.id; scheduledAt = (Get-Date).AddDays(3).ToUniversalTime().ToString('o'); examId = $exam.id; exam = 'Smoke Paper'; lectureVideoId = $video.id; lecture = 'Orientation' } $t
"schedule: $($row.dateTime -replace "`n", ' / ')"
$null = Call POST '/admin/announcements' @{ title = 'Smoke notice'; body = 'Hello students'; pinned = $true } $t

$mobile = '017' + (Get-Random -Minimum 10000000 -Maximum 99999999)
$null = Call POST '/auth/register' @{ fullName = 'Dr. Smoke Test'; mobile = $mobile; password = 'Password123'; confirmPassword = 'Password123'; institution = 'DMC'; interest = 'FCPS'; acceptTerms = $true; email = ''; bmdcNumber = '' }
"registered $mobile - check backend terminal for [SMS] code"
Write-Output "MOBILE=$mobile"
Write-Output "COURSE=$slug"
Write-Output "EXAM=$($exam.id)"

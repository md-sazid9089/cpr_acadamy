# Second half of the smoke test.
# Usage: $env:ADMIN_PASSWORD='...'; powershell -File scripts/smoke-student.ps1 -Mobile <mobile> -Otp <otp> -Slug <courseSlug> -ExamId <examId>
param([string]$Mobile, [string]$Otp, [string]$Slug, [string]$ExamId)
$ErrorActionPreference = 'Stop'
if (-not $env:ADMIN_PASSWORD) { throw 'Set ADMIN_PASSWORD (the local administrator password) before running.' }
$adminMobile = if ($env:ADMIN_MOBILE) { $env:ADMIN_MOBILE } else { '01799999999' }
$base = 'http://127.0.0.1:3001/api'
function Call($method, $path, $body, $token, $device = 'smoke-student-device', $extra = @{}) {
  $headers = @{ 'X-Device-Id' = $device } + $extra
  if ($token) { $headers.Authorization = "Bearer $token" }
  $params = @{ Method = $method; Uri = "$base$path"; Headers = $headers; ContentType = 'application/json' }
  if ($null -ne $body) { $params.Body = ($body | ConvertTo-Json -Depth 10) }
  try { Invoke-RestMethod @params } catch { $r = $_.Exception.Response; $s = New-Object IO.StreamReader($r.GetResponseStream()); throw "$method $path -> $([int]$r.StatusCode) $($s.ReadToEnd())" }
}

$pending = Call POST '/auth/otp/verify' @{ mobile = $Mobile; otp = $Otp }
"verified: status=$($pending.user.status) token=$([bool]$pending.accessToken)"
"approval-status: $((Call GET '/auth/approval-status' $null $pending.accessToken).status)"
try { Call GET '/me/enrollments' $null $pending.accessToken; 'ERROR: pending user reached protected data' } catch { "pending gate ok: $($_.ToString().Split('{')[1].Split(',')[0])" }

$admin = Call POST '/auth/login' @{ mobile = $adminMobile; password = $env:ADMIN_PASSWORD } $null 'smoke-device-0001'
$students = Call GET '/admin/students?status=awaiting_approval' $null $admin.accessToken 'smoke-device-0001'
$me = $students | Where-Object { $_.mobile -eq $Mobile }
$null = Call PATCH "/admin/students/$($me.id)/status" @{ status = 'active' } $admin.accessToken 'smoke-device-0001'
'approved'

$student = Call POST '/auth/login' @{ mobile = $Mobile; password = 'Password123' }
$t = $student.accessToken
"student login: $($student.user.status)"
$catalog = Call GET '/courses?category=FCPS&batchTypes=foundation,crash' 
"catalog: $($catalog.Count) course(s)"
$course = Call GET "/courses/$Slug"
$enrol = Call POST "/courses/$($course.id)/enroll" $null $t
"enrol -> $($enrol.redirectTo)"
$payment = Call POST '/payments/initiate' @{ courseSlug = $Slug; method = 'manual' } $t 'smoke-student-device' @{ 'Idempotency-Key' = "smoke-$Mobile" }
"invoice $($payment.invoiceNo) amount=$($payment.amount) status=$($payment.status)"
$again = Call POST '/payments/initiate' @{ courseSlug = $Slug; method = 'manual' } $t 'smoke-student-device' @{ 'Idempotency-Key' = "smoke-$Mobile" }
"idempotent: $($again.id -eq $payment.id)"
try { Call GET "/courses/$Slug/videos" $null $t; 'ERROR: unpaid student saw videos' } catch { 'unpaid gate ok' }
$null = Call POST "/admin/payments/$($payment.id)/confirm" @{ transactionId = "TXN-$Mobile"; amount = $payment.amount; evidence = 'Matched against merchant statement.' } $admin.accessToken 'smoke-device-0001'
'payment confirmed'
$mine = Call GET '/me/enrollments' $null $t
"enrollments: $($mine[0].title) status=$($mine[0].status) lessons=$($mine[0].lessonCount)"
$videos = Call GET "/courses/$Slug/videos" $null $t
"videos: $($videos[0].videos[0].title) src=$($videos[0].videos[0].src)"
$null = Call POST "/lessons/$($videos[0].videos[0].id)/complete" $null $t
"progress: $((Call GET '/me/progress' $null $t).overallProgress)%"
$schedule = Call GET "/courses/$Slug/schedule"
"schedule rows: $($schedule.Count)"
$exams = Call GET "/courses/$Slug/exams" $null $t
"exams sba=$($exams.sba.Count) mcq=$($exams.mcq.Count)"
$paper = Call POST "/exams/$ExamId/start" $null $t
"paper: $($paper.questions.Count) q, endsAt=$($paper.endsAt), hasKey=$([bool]($paper.questions[0].PSObject.Properties['correctAnswer']))"
$null = Call POST "/exams/$ExamId/answers" @{ questionId = 'q1'; answer = 'b' } $t
$result = Call POST "/exams/$ExamId/submit" @{ answers = @{} } $t
"submitted: score=$($result.score)/$($result.totalMarks)"
$review = Call GET "/exams/$ExamId/result" $null $t
"result: rank=$($review.rank) of $($review.participants), yourAnswer=$($review.review[0].yourAnswer)"
"notices: $((Call GET '/announcements').Count)"
$profile = Call PATCH '/me/profile' @{ section = 'address'; values = @{ district = 'Dhaka' } } $t
"profile district=$($profile.address.district)"
$c = Call POST '/me/complaints' @{ relatedTo = 'Exam & Result'; batchTitle = 'Smoke'; body = 'Where is my result?' } $t
$null = Call POST "/admin/complaints/$($c.id)/replies" @{ body = 'Published now.' } $admin.accessToken 'smoke-device-0001'
"complaint: $((Call GET "/me/complaints/$($c.id)" $null $t).status)"
"revenue thisMonth=$((Call GET '/admin/revenue' $null $admin.accessToken 'smoke-device-0001').summary.thisMonth)"
$refreshed = Call POST '/auth/refresh' @{ refreshToken = $student.refreshToken } $null
"refresh ok: $([bool]$refreshed.accessToken)"
try { Call GET '/me/enrollments' $null $t; 'ERROR: old token still valid' } catch { 'old token revoked after refresh' }
'ALL GOOD'

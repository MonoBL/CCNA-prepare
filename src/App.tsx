import { Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Resources from "@/pages/Resources";
import Study from "@/pages/Study";
import Domain from "@/pages/Domain";
import Subtopic from "@/pages/Subtopic";
import Practice from "@/pages/Practice";
import PracticeRun from "@/pages/PracticeRun";
import Labs from "@/pages/Labs";
import Lab from "@/pages/Lab";
import Exam from "@/pages/Exam";
import ExamRun from "@/pages/ExamRun";
import ExamResult from "@/pages/ExamResult";
import Review from "@/pages/Review";
import Diagnostic from "@/pages/Diagnostic";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="diagnostic" element={<Diagnostic />} />
        <Route path="study" element={<Study />} />
        <Route path="study/:domainId" element={<Domain />} />
        <Route path="study/:domainId/:subtopicId" element={<Subtopic />} />
        <Route path="practice" element={<Practice />} />
        <Route path="practice/run" element={<PracticeRun />} />
        <Route path="labs" element={<Labs />} />
        <Route path="labs/:labId" element={<Lab />} />
        <Route path="exam" element={<Exam />} />
        <Route path="exam/run" element={<ExamRun />} />
        <Route path="exam/result/:runId" element={<ExamResult />} />
        <Route path="review" element={<Review />} />
        <Route path="resources" element={<Resources />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Dashboard />} />
      </Route>
    </Routes>
  );
}

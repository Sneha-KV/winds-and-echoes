import { useState } from 'react';
import Dashboard from './screens/Dashboard.jsx';
import NewPost from './screens/NewPost.jsx';
import PipelineOptions from './screens/PipelineOptions.jsx';
import Review from './screens/Review.jsx';
import Publish from './screens/Publish.jsx';

// Screens in the author workflow
const SCREENS = {
  DASHBOARD: 'dashboard',
  NEW_POST: 'new_post',
  PIPELINE_OPTIONS: 'pipeline_options',
  REVIEW: 'review',
  PUBLISH: 'publish',
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.DASHBOARD);
  const [postData, setPostData] = useState(null);

  const navigate = (to, data = null) => {
    if (data) setPostData(prev => ({ ...prev, ...data }));
    setScreen(to);
  };

  return (
    <div className="app">
      {screen === SCREENS.DASHBOARD && (
        <Dashboard onNewPost={() => navigate(SCREENS.NEW_POST)} />
      )}
      {screen === SCREENS.NEW_POST && (
        <NewPost
          onNext={(data) => navigate(SCREENS.PIPELINE_OPTIONS, data)}
          onBack={() => navigate(SCREENS.DASHBOARD)}
        />
      )}
      {screen === SCREENS.PIPELINE_OPTIONS && (
        <PipelineOptions
          postData={postData}
          onNext={(data) => navigate(SCREENS.REVIEW, data)}
          onBack={() => navigate(SCREENS.NEW_POST)}
        />
      )}
      {screen === SCREENS.REVIEW && (
        <Review
          postData={postData}
          onApprove={(data) => navigate(SCREENS.PUBLISH, data)}
          onBack={() => navigate(SCREENS.PIPELINE_OPTIONS)}
        />
      )}
      {screen === SCREENS.PUBLISH && (
        <Publish
          postData={postData}
          onDone={() => navigate(SCREENS.DASHBOARD)}
        />
      )}
    </div>
  );
}

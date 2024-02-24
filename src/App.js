import React, { useState, useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { from, zip } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import bbggmm from './star_wars_theme.mp3';

function App() {
  const [planets, setPlanets] = useState([]);
  const [nextPage, setNextPage] = useState(null);

  useEffect(() => {
    fetchPlanets('https://swapi.dev/api/planets/?format=json');
  }, []);

  useEffect(() => {
    const audio = new Audio(bbggmm);
    audio.loop = true;
    audio.play();
    return () => {
      audio.pause();
    };
  }, []);

  const fetchPlanets = (url) => {
    from(fetch(url))
      .pipe(
        switchMap(response => response.json()),
        map(data => {
          // Delay the appending of new planets for 300ms
          setTimeout(() => {
            setPlanets(prevPlanets => [...prevPlanets, ...data.results]);
            setNextPage(data.next);
          }, 300);
        }),
        catchError(error => console.error('Error fetching planets:', error))
      )
      .subscribe();
  };
  const fetchNextPage = () => {
    if (nextPage) {
      fetchPlanets(nextPage);
    }
  };

  return (
    <Router>
      <div className="App">
        <header>
          <h1>Star Wars Planets Directory</h1>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<HomePage planets={planets} fetchNextPage={fetchNextPage} />} />
            <Route path="/planet/:id" element={<PlanetDetailsPage planets={planets} />} />
          </Routes>
        </main>
        <footer>
          <p>© 2024 Star Wars</p>
        </footer>
      </div>
    </Router>
  );
}

const HomePage = ({ planets, fetchNextPage }) => (
  <div>
    <TransitionGroup className="planets">
      {planets.map((planet, index) => (
        <CSSTransition key={index} timeout={500} classNames="planet">
          <div className="planet-card">
            <Link to={`/planet/${index}`}>
              <h2>{planet.name}</h2>
            </Link>
          </div>
        </CSSTransition>
      ))}
    </TransitionGroup>
    <center>
      <button onClick={fetchNextPage} className="load-more-btn">
        Explore More 🚀
      </button>
    </center>
  </div>
);

const PlanetDetailsPage = ({ planets }) => {
  const location = useLocation();
  const planetIndex = parseInt(location.pathname.split('/')[2]);
  const planet = planets[planetIndex];

  return (
    <div>
      <div className="planet-details-card">
        <h2>{planet.name}</h2>
        <p><strong>Climate:</strong> {planet.climate}</p>
        <p><strong>Population:</strong> {planet.population !== 'unknown' ? planet.population : 'Unknown'}</p>
        <p><strong>Terrain:</strong> {planet.terrain}</p>
        {planet.population !== 'unknown' && <ResidentsButton residentsUrls={planet.residents} />}
      </div>
      <div className="center">
        <Link to="/" className="home-btn">
          Home
        </Link>
      </div>
    </div>
  );
};

const ResidentsButton = ({ residentsUrls }) => {
  const [showResidents, setShowResidents] = useState(false);
  const [residents, setResidents] = useState([]);

  const toggleResidents = () => {
    const requests = residentsUrls.map(url => from(fetch(url)).pipe(switchMap(response => response.json())));
    zip(...requests)
      .pipe(
        map(data => {
          setResidents(data);
          setShowResidents(!showResidents);
        }),
        catchError(error => console.error('Error fetching residents:', error))
      )
      .subscribe();
  };

  return (
    <div>
      <button onClick={toggleResidents} className="residents-button">
        {showResidents ? 'Hide Residents' : 'Show Residents 🏠'} {/* Added home emoji */}
      </button>
      {showResidents && <Residents residents={residents} />}
    </div>
  );
};

const Residents = ({ residents }) => (
  <div className="residents-card">
    <h3>Residents:</h3>
    <ul>
      {residents.map((resident, index) => (
        <li key={index}>
          <p><strong>Name:</strong> {resident.name}</p>
          <p><strong>Height:</strong> {resident.height}</p>
          <p><strong>Mass:</strong> {resident.mass}</p>
          <p><strong>Gender:</strong> {resident.gender}</p>
        </li>
      ))}
    </ul>
  </div>
);

export default App;

// Name: Lee Jacobson
// Modified By: Robert Feddeler
// Date: 7TH MAY 2015
// Description: Ant Colony Optimization Implementation in JavaScript
// URL: http://www.theprojectspot.com/tutorial-post/ant-colony-optimization-for-hackers/10

function drawSolution(tour) {
	var canvas = document.getElementById('myCanvas');
    var ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var cty, swapped = false;
    var acum = 0.0;
    var distA, distB;
    var ca, cb, dx1, dy1, dx2, dy2;

    ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.beginPath();

    for (let i = 0; i < tour.size(); i++) {
        cty = tour.get(i);

        if (i == 0)
            ctx.moveTo(cty.getX1(), cty.getY1());
        else
            ctx.lineTo(cty.getX1(), cty.getY1());

        if (!swapped && i >= tour.size() / 2) {
            swapped = true;

            distA = acum;
            
            ca = tour.get(i);
            cb = tour.get(i+1);

            var dx1 = ca.getX2() - ca.getX1();
            var dy1 = ca.getY2() - ca.getY1();

            var dx2 = cb.getX1() - ca.getX2();
            var dy2 = cb.getY1() - ca.getY2();

            acum = Math.sqrt((dx1 * dx1) + (dy1 * dy1)) + Math.sqrt((dx2 * dx2) + (dy2 * dy2));

            ctx.stroke();
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        }
        else if ((!swapped && i >= tour.size() / 2 - 1) || (i == tour.size() - 1)) {
            ca = tour.get(i);
            dx1 = ca.getX2() - ca.getX1();
            dy1 = ca.getY2() - ca.getY1();

            acum += Math.sqrt((dx1 * dx1) + (dy1 * dy1));
        }
        else {
            ca = tour.get(i);
            cb = tour.get(i+1);

            var dx1 = ca.getX2() - ca.getX1();
            var dy1 = ca.getY2() - ca.getY1();

            var dx2 = cb.getX1() - ca.getX2();
            var dy2 = cb.getY1() - ca.getY2();

            acum += Math.sqrt((dx1 * dx1) + (dy1 * dy1)) + Math.sqrt((dx2 * dx2) + (dy2 * dy2));
        }

        ctx.lineTo(cty.getX2(), cty.getY2());
    }

    distB = acum;
    ctx.stroke();

    console.log('Separate: ' + distA.toFixed(2) + ', ' + distB.toFixed(2));
}

var AntColony = (function () {
    function AntColony(drawing) {
        this._graph = new Graph();
        this._colony = [];

        // Add cities to graph
        for (let i = 0; i < drawing.length; i++)
        	this._graph.addCity(drawing[i][0], drawing[i][1], drawing[i][2], drawing[i][3]);
        
        this._graph.createEdges();

        // Set default params
        this._colonySize = 15;
        this._alpha = 1;
        this._beta = 3;
        this._rho = 0.1;
        this._q = 1;
        this._initPheromone = this._q;
        this._type = 'elitist'; // 'acs', 'elitist'
        this._elitistWeight = 2;
        this._maxIterations = 150;
        this._minScalingFactor = 0.001;

        this._iteration = 0;
        this._minPheromone = null;
        this._maxPheromone = null;

        this._iterationBest = null;
        this._globalBest = null;

        this._createAnts();
        this.reset();
        this.run();
    }

    AntColony.prototype.getGraph = function() { return this._graph; };
    AntColony.prototype.getAnts = function() { return this._colony; };
    AntColony.prototype.size = function() { return this._colony.length; };
    AntColony.prototype.currentIteration = function() { return this._iteration; };
    AntColony.prototype.maxIterations = function() { return this._maxIterations; };

    AntColony.prototype._createAnts = function() {
        this._colony = [];
        for (var antIndex = 0; antIndex < this._colonySize; antIndex++) {
            this._colony.push(new Ant(this._graph, {
                'alpha': this._alpha,
                'beta': this._beta,
                'q': this._q,
            }));
        }
    };

    AntColony.prototype.reset = function() {
        this._iteration = 0;
        this._globalBest = null;
        this.resetAnts();
        this.setInitialPheromone(this._initPheromone);
        this._graph.resetPheromone();
    };

    AntColony.prototype.setInitialPheromone = function () {
        var edges = this._graph.getEdges();
        for (var edgeIndex in edges) {
            edges[edgeIndex].setInitialPheromone(this._initPheromone);
        }
    };

    AntColony.prototype.resetAnts = function() {
        this._createAnts();
        this._iterationBest = null;
    };
    
    AntColony.prototype.ready = function() {
        if (this._graph.size() <= 1) {
            return false;
        }
        return true;
    }

    AntColony.prototype.run = function() {
        if (!this.ready()) {
            return;
        }
    
        this._iteration = 0;
        while (this._iteration < this._maxIterations) {
            this.step();
        }

        console.log('Line Count: ' + this.getGlobalBest().getTour().size());
        console.log('Global Best:' + this.getGlobalBest().getTour().distance().toFixed(2));
        drawSolution(this.getGlobalBest().getTour());
    };
    
    AntColony.prototype.step = function() {
        if (!this.ready() || this._iteration >= this._maxIterations) {
            return;
        }

        this.resetAnts();

        for (var antIndex in this._colony) {
            this._colony[antIndex].run();
        }

        this.getGlobalBest();
        this.updatePheromone();

        this._iteration++;
    };

    AntColony.prototype.updatePheromone = function() {
        var edges = this._graph.getEdges();
        for (var edgeIndex in edges) {
            var pheromone = edges[edgeIndex].getPheromone();
            edges[edgeIndex].setPheromone(pheromone * (1 - this._rho));
        }

        if (this._type == 'maxmin') {
            if ((this._iteration / this._maxIterations) > 0.75) {
                var best = this.getGlobalBest();
            } else {
                var best = this.getIterationBest();
            }
            
            // Set maxmin
            this._maxPheromone = this._q / best.getTour().distance();
            this._minPheromone = this._maxPheromone * this._minScalingFactor;

            best.addPheromone();
        } else {
            for (var antIndex in this._colony) {
                this._colony[antIndex].addPheromone();
            }
        }

        if (this._type == 'elitist') {
            this.getGlobalBest().addPheromone(this._elitistWeight);
        }

        if (this._type == 'maxmin') {
            for (var edgeIndex in edges) {
                var pheromone = edges[edgeIndex].getPheromone();
                if (pheromone > this._maxPheromone) {
                    edges[edgeIndex].setPheromone(this._maxPheromone);
                } else if (pheromone < this._minPheromone) {
                    edges[edgeIndex].setPheromone(this._minPheromone);
                }
            }
        }
    };
    
    AntColony.prototype.getIterationBest = function() {
        if (this._colony[0].getTour() == null) {
            return null;
        }

        if (this._iterationBest == null) {
            var best = this._colony[0];

            for (var antIndex in this._colony) {
                if (best.getTour().distance() >= this._colony[antIndex].getTour().distance()) {
                    this._iterationBest = this._colony[antIndex];
                }
            }
        }

        return this._iterationBest;
    };

    AntColony.prototype.getGlobalBest = function() {
        var bestAnt = this.getIterationBest();
        if (bestAnt == null && this._globalBest == null) {
            return null;
        }

        if (bestAnt != null) {
            if (this._globalBest == null || this._globalBest.getTour().distance() >= bestAnt.getTour().distance()) {
                this._globalBest = bestAnt;
            }
        }

        return this._globalBest;
    };

    return AntColony;
})();

var Ant = (function () {
    function Ant(graph, params) {
        this._graph = graph;
        
        this._alpha = params.alpha;
        this._beta = params.beta;
        this._q = params.q;
        this._tour = null;
    }

    Ant.prototype.reset = function() {
        this._tour = null;
    };
    
    Ant.prototype.init = function() {
        this._tour = new Tour(this._graph);
        var randCityIndex = Math.floor(Math.random() * this._graph.size());
        this._currentCity = this._graph.getCity(randCityIndex);
        this._tour.addCity(this._currentCity);
    }

    Ant.prototype.getTour = function() {
        return this._tour;
    };

    Ant.prototype.makeNextMove = function() {
        if (this._tour == null) {
            this.init();
        }

        var rouletteWheel = 0.0;
        var cities = this._graph.getCities();

        var cityProbabilities = [];
        for (var cityIndex in cities) {
            if (!this._tour.contains(cities[cityIndex])) {
                var edge = this._graph.getEdge(this._currentCity, cities[cityIndex]);
                if (this._alpha == 1) {
                    var finalPheromoneWeight = edge.getPheromone();
                } else {
                    var finalPheromoneWeight = Math.pow(edge.getPheromone(), this._alpha);
                }
                cityProbabilities[cityIndex] = finalPheromoneWeight * Math.pow(1.0 / edge.getDistance(), this._beta);
                rouletteWheel += cityProbabilities[cityIndex];
            }
        }

        var wheelTarget = rouletteWheel * Math.random();

        var wheelPosition = 0.0;
        for (var cityIndex in cities) {
            if (!this._tour.contains(cities[cityIndex])) {
                wheelPosition += cityProbabilities[cityIndex];
                if (wheelPosition >= wheelTarget) {
                    this._currentCity = cities[cityIndex];
                    this._tour.addCity(cities[cityIndex]);
                    return;
                }
            }
        }
    };

    Ant.prototype.tourFound = function() {
        if (this._tour == null) {
            return false;
        }
        return (this._tour.size() >= this._graph.size());
    };

    Ant.prototype.run = function(callback) {
        this.reset();
        while (!this.tourFound()) {
            this.makeNextMove();
        }
    };

    Ant.prototype.addPheromone = function(weight) {
        if (weight == undefined) {
            weight = 1;
        }

        var extraPheromone = (this._q * weight) / this._tour.distance();
        for (var tourIndex = 0; tourIndex < this._tour.size(); tourIndex++) {
            if (tourIndex >= this._tour.size()-1) {
                var fromCity = this._tour.get(tourIndex);
                var toCity = this._tour.get(0);
                var edge = this._graph.getEdge(fromCity, toCity);
                var pheromone = edge.getPheromone();
                edge.setPheromone(pheromone + extraPheromone);
            } else {
                var fromCity = this._tour.get(tourIndex);
                var toCity = this._tour.get(tourIndex+1);
                var edge = this._graph.getEdge(fromCity, toCity);
                var pheromone = edge.getPheromone();
                edge.setPheromone(pheromone + extraPheromone);
            }
        }
    };

    return Ant;
})();

var Graph = (function () {
    function Graph() {
        this._cities = [];
        this._edges = {};
    }

    Graph.prototype.getEdges = function() { return this._edges; };
    Graph.prototype.getEdgeCount = function() { return Object.keys(this._edges).length };
    
    Graph.prototype.getCity = function(cityIndex) {
        return this._cities[cityIndex];
    };
    
    Graph.prototype.getCities = function() {
        return this._cities;
    };
    
    Graph.prototype.size = function() {
        return this._cities.length;
    };

    Graph.prototype.addCity = function(x1, y1, x2, y2) {
        this._cities.push(new City(x1,y1,x2,y2));
    };

    Graph.prototype._addEdge = function(cityA, cityB) {
        this._edges[cityA.toString() + '-' + cityB.toString()] = new Edge(cityA, cityB);
    };
    
    Graph.prototype.getEdge = function(cityA, cityB) {
        if (this._edges[cityA.toString() + '-' + cityB.toString()] != undefined) {
            return this._edges[cityA.toString() + '-' + cityB.toString()];
        }
        if (this._edges[cityB.toString() + '-' + cityA.toString()] != undefined) {
            return this._edges[cityB.toString() + '-' + cityA.toString()];
        }
    };

    Graph.prototype.createEdges = function() {
        this._edges = {};

        for (var cityIndex = 0; cityIndex < this._cities.length; cityIndex++) {
            for (var connectionIndex = cityIndex; connectionIndex < this._cities.length; connectionIndex++) {
                this._addEdge(this._cities[cityIndex], this._cities[connectionIndex]);
            }
        }
    };
    
    Graph.prototype.resetPheromone = function() {
        for (var edgeIndex in this._edges) {
            this._edges[edgeIndex].resetPheromone();
        }
    }
    
    Graph.prototype.clear = function() {
        this._cities = [];
        this._edges = {};
    }

    return Graph;
})();

var City = (function () {
    function City(x1, y1, x2, y2) {
        this._x1 = x1;
        this._y1 = y1;
        this._x2 = x2;
        this._y2 = y2;
    }

    City.prototype.getX1 = function() { return this._x1; };
    City.prototype.getY1 = function() { return this._y1; };
    City.prototype.getX2 = function() { return this._x2; };
    City.prototype.getY2 = function() { return this._y2; };

    City.prototype.toString = function() {
        return this._x1 + ',' + this._y1 + ', ' + this._x2 + ',' + this._y2;
    };

    City.prototype.isEqual = function(city) {
        if (this._x1 == city._x1 && this._y1 == city._y1 && this._x2 == city._x2 && this._y2 == city._y2) {
            return true;
        }
        return false;
    };

    return City;
})();

var Edge = (function () {
    function Edge(cityA, cityB) {
        this._cityA = cityA;
        this._cityB = cityB;
        this._initPheromone = 1;
        this._pheromone = this._initPheromone;

        // Calculate edge distance
        var dx1 = cityA.getX2() - cityA.getX1();
        var dy1 = cityA.getY2() - cityA.getY1();
        var dist1 = Math.sqrt((dx1 * dx1) + (dy1 * dy1));

        var dx2 = cityB.getX1() - cityA.getX2();
        var dy2 = cityB.getY1() - cityA.getY2();
        var dist2 = Math.sqrt((dx2 * dx2) + (dy2 * dy2));

        this._distance = Math.sqrt(dist1 + dist2);
    }

    Edge.prototype.pointA = function() {
        return { 'x': this._cityA.getX1(), 'y': this._cityA.getY1() };
    }
    
    Edge.prototype.pointB = function() {
        return { 'x': this._cityB.getX2(), 'y': this._cityB.getY2() };
    }
    
    Edge.prototype.getPheromone = function() { return this._pheromone; };

    Edge.prototype.getDistance = function() { return this._distance; };

    Edge.prototype.contains = function(city) {
        if (this._cityA.getX1() == city.getX1()) {
            return true;
        }
        if (this._cityB.getX2() == city.getX2()) {
            return true;
        }
        return false;
    };

    Edge.prototype.setInitialPheromone = function(pheromone) {
        this._initPheromone = pheromone;
    };

    Edge.prototype.setPheromone = function(pheromone) {
        this._pheromone = pheromone;
    };
    
    Edge.prototype.resetPheromone = function() {
        this._pheromone = this._initPheromone;
    };

    return Edge;
})();

var Tour = (function () {
    function Tour(graph) {
        this._graph = graph;
        this._tour = [];
        this._distance = null;
    }

    Tour.prototype.size = function() { return this._tour.length; };

    Tour.prototype.contains = function(city) {
        for (var tourIndex in this._tour) {
            if (city.isEqual(this._tour[tourIndex])) {
                return true;
            }
        }

        return false;
    };

    Tour.prototype.addCity = function(city) {
        this._distance = null;
        this._tour.push(city);
    };

    Tour.prototype.get = function(tourIndex) {
        return this._tour[tourIndex];
    };
    
    Tour.prototype.distance = function() {
        if (this._distance == null) {
            var distance = 0.0;

            for (var tourIndex = 0; tourIndex < this._tour.length; tourIndex++) {
                if (tourIndex >= this._tour.length-1) {
                	var CityA = this._tour[tourIndex];
                	var dx1 = CityA.getX2() - CityA.getX1();
    				var dy1 = CityA.getY2() - CityA.getY1();

                    distance += Math.sqrt((dx1 * dx1) + (dy1 * dy1));
                } else {
                	var CityA = this._tour[tourIndex];
                	var CityB = this._tour[tourIndex+1];

                	var dx1 = CityA.getX2() - CityA.getX1();
    				var dy1 = CityA.getY2() - CityA.getY1();
    				var d1 = Math.sqrt((dx1 * dx1) + (dy1 * dy1));

					var dx2 = CityB.getX1() - CityA.getX2();
					var dy2 = CityB.getY1() - CityA.getY2();
					var d2 = Math.sqrt((dx2 * dx2) + (dy2 * dy2));

					distance += d1 + d2;
                }
            }

            this._distance = distance;
        }

        return this._distance;
    };

    return Tour;
})();

// Title: Simulating Annealing Javascript Example 1: Travelling Salesman Problem
// Author: John McCullock
// Modified By: Robert Feddeler
// Date: January 28, 2012
// Copyright(c) John McCullock.

var INITIAL_TEMPERATURE = 190.0;
var FINAL_TEMPERATURE = 0.5;
var DELTA = 0.0005;
var ITERATIONS_AT_TEMPERATURE = 32;

var currentSolution = null; // type Solution
var workingSolution = null; // type Solution
var bestSolution = null;    // type Solution

var CITY_COUNT;
var map;

function simulatedAnneal(drawing)
{
    map = drawing;
    CITY_COUNT = map.length;

    var solution = false;
    var useNew = false;
    var accepted = 0;
    var temperature = INITIAL_TEMPERATURE;

    currentSolution = new Solution();
    workingSolution = new Solution();
    bestSolution = new Solution();
    
    for(var i = 0; i < CITY_COUNT; i++)
        currentSolution.setData(i, i);

    for(var i = 0; i < CITY_COUNT; i++)
        currentSolution.randomChange();

    currentSolution.computeEnergy();

    bestSolution.setSolutionEnergy(currentSolution.getSolutionEnergy());
    bestSolution.setSeparateSolutionEnergy(currentSolution.getSeparateSolutionEnergy());

    workingSolution.equals(currentSolution);

    while(temperature > FINAL_TEMPERATURE)
    {
        accepted = 0;

        for (let i = 0; i < ITERATIONS_AT_TEMPERATURE; i++)
        {
            useNew = false;

            workingSolution.randomChange();
            
            workingSolution.computeEnergy();

            if (workingSolution.getSolutionEnergy() <= currentSolution.getSolutionEnergy()) {
                useNew = true;
            }
            else {
                var test = Math.random();
                var change = workingSolution.getSolutionEnergy() - currentSolution.getSolutionEnergy();
                var calc = Math.exp(-change / temperature);
                if (calc > test) {
                    accepted++;
                    useNew = true;
                }
            }

            if (useNew) {
                useNew = false;
                currentSolution.equals(workingSolution);
                if (currentSolution.getSolutionEnergy() < bestSolution.getSolutionEnergy()) {
                    bestSolution.equals(currentSolution);
                    solution = true;
                }
            }
            else {
                workingSolution.equals(currentSolution);
            }
        }
        
        temperature -= DELTA;
    }
    
    if (solution) {
        drawSolution(bestSolution);

        console.log('Line Count: ' + CITY_COUNT);
        console.log('Final Total Distance: ' + bestSolution.getSolutionEnergy());

        var sep = bestSolution.getSeparateSolutionEnergy();
        console.log("A's Distance: " + sep.A + ", B's Distance: " + sep.B);
    }

    return;
}

function drawSolution(s) {
    var canvas = document.getElementById('myCanvas');
    var ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var cty, swapped = false;

    ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.beginPath();

    for (let i = 0; i < CITY_COUNT; i++) {
        cty = map[s.getData(i)];

        if (i == 0)
            ctx.moveTo(cty[0], cty[1]);
        else
            ctx.lineTo(cty[0], cty[1]);

        if (!swapped && i >= CITY_COUNT / 2) {
            swapped = true;

            ctx.stroke();
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        }

        ctx.lineTo(cty[2], cty[3]);
    }

    ctx.stroke();
}

function getDistanceOfSelf(city)
{
    var c = map[city];

    var dx = c[2] - c[0];
    var dy = c[3] - c[1];

    return Math.sqrt((dx * dx) + (dy * dy));
}

// FirstCity and SecondCity are type Number.
function getDistance(FirstCity, SecondCity)
{
	var CityA = map[FirstCity];
	var CityB = map[SecondCity];

	var dx = CityB[0] - CityA[2];
	var dy = CityB[1] - CityA[3];

	var distB = Math.sqrt((dx * dx) + (dy * dy));

	return distB;
}

function getRandomNumber(low, high)
{
    return Math.round((high - low) * Math.random() + low);
}

function getExclusiveRandomNumber(low, high, except)
{
    var done = false;
    var getRand = 0;

    while (!done)
    {
        getRand = getRandomNumber(low, high);

        if (getRand != except)
            done = true;
    }

    return getRand;
}

// "that" is of type Solution.
function Solution(that)
{
    this.mSolutionEnergy = 0.0;
    this.mSolutionEnergyA = 0.0;
    this.mSolutionEnergyB = 0.0;
    this.mData = null; // array of type Number.
    
    // "that" is of type Solution.
    this.equals = function(that)
    {
        for (let i = 0; i < CITY_COUNT; i++)
            this.mData[i] = that.getData(i);

        this.mSolutionEnergy = that.getSolutionEnergy();

        let sse = that.getSeparateSolutionEnergy();
        this.mSolutionEnergyA = sse.A;
        this.mSolutionEnergyB = sse.B;

        return;
    }
    
    this.setData = function(index, value)
    {
        this.mData[index] = value;
        return;
    }
    
    this.getData = function(index)
    {
        return this.mData[index];
    }
    
    this.setSolutionEnergy = function(value)
    {
        this.mSolutionEnergy = value;
        return;
    }

    this.setSeparateSolutionEnergy = function(value)
    {
        this.mSolutionEnergyA = value.A;
        this.mSolutionEnergyB = value.B;
        return;
    }
    
    this.getSolutionEnergy = function()
    {
        return this.mSolutionEnergy;
    }

    this.getSeparateSolutionEnergy = function()
    {
        return { A: this.mSolutionEnergyA, B: this.mSolutionEnergyB };
    }
    
    this.randomChange = function()
    {
        var x = getRandomNumber(0, CITY_COUNT - 1);
        var y = getExclusiveRandomNumber(0, CITY_COUNT - 1, x);
        
        var temp = this.mData[x];
        this.mData[x] = this.mData[y];
        this.mData[y] = temp;

        return;
    }
    
    this.computeEnergy = function()
    {
        this.mSolutionEnergy = 0.0;
        this.mSolutionEnergyA = 0.0;
        this.mSolutionEnergyB = 0.0;

        var v;
        
        // Find the round-trip distance. 
        for (let i = 0; i < CITY_COUNT; i++)
        {
            if (i == CITY_COUNT - 1)
                v = getDistanceOfSelf(this.mData[i]);
            else
                v = getDistance(this.mData[i], this.mData[i + 1]) + getDistanceOfSelf(this.mData[i]);

            this.mSolutionEnergy += v;

            if (i >= CITY_COUNT / 2)
                this.mSolutionEnergyB += v;
            else
                this.mSolutionEnergyA += v;

            if (i < CITY_COUNT / 2 && getDistance(this.mData[i], this.mData[i + parseInt((CITY_COUNT/2))]) < 50)
                this.mSolutionEnergy += 10000;
        }

        return;
    }
    
    this.mData = new Array(CITY_COUNT);
    if (that != null) {
        for (let i = 0; i < CITY_COUNT; i++)
            this.mData[i] = that.getData(i);

        this.mSolutionEnergy = that.getSolutionEnergy();

        let sse = that.getSeparateSolutionEnergy();
        this.mSolutionEnergyA = sse.A;
        this.mSolutionEnergyB = sse.B;
    }
    
    return;
} // Solution class

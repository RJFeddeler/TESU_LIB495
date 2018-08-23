// Name: John M. McCullock
// Modified By: Robert Feddeler
// Date: 12-02-06
// Description: Genetic Algorithm: TSP Example 1

const START_SIZE = 400;     // Population size at start.
const MAX_EPOCHS = 1100;    // Arbitrary number of test cycles.
const R_RATE = 0.7;        // Probability of two chromosomes mating.
                              // Range: 0.0 < rRate < 1.0
const M_RATE = 0.001;      // Mutation Rate.
                              // Range: 0.0 < mRate < 1.0
const MIN_SELECT = 20;     // Minimum parents allowed for selection.
const MAX_SELECT = 80;     // Maximum parents allowed for selection.
                              // Range: MinSelect < MaxSelect < StartSize
const O_RATE = 40;         // New offspring created per generation.
                              // Range: 0 < oRate < MaxSelect.
const MIN_SHUFFLES = 8;    // For randomizing starting chromosomes.
const MAX_SHUFFLES = 20;

var childCount = 0;
var mutations = 0;
var nextMutation = 0;

var MAX_SIZE;

var bestChromo = new cChromosome();
var bestDist = -1;

function genetic(drawing)
{
    var map = drawing;
    MAX_SIZE = map.length;

    var population = new Array(0);

    var epoch = 0;
    var popSize = 0;
    var thisChromo = new cChromosome();
    var done = false;

    initializeChromosomes(population, map);
    nextMutation = getRandomNumber(0, (1 / M_RATE));

    do {
        popSize = population.length;
        for (let i = 0; i < popSize; i++) {
            thisChromo = population[i];

            if (epoch == MAX_EPOCHS)
                done = true;
        }

        fitness(population);
   
        rouletteSelection(population);

        mating(population, map);

        prepNextEpoch(population);

        epoch += 1;
    } while (!done);

    console.log('Line Count: ' + MAX_SIZE);
    console.log('Completed '+epoch+' epochs. Encountered '+mutations+'  mutations in '+ childCount+' offspring.');
    console.log('Best of all Time: ' + bestChromo.getTotal().toFixed(2));
    
    drawSolution(bestChromo, map);
}

function drawSolution(chromo, map) {
    var canvas = document.getElementById('myCanvas');
    var ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    var cty, swapped = false;
    var acum = 0.0;
    var distA, distB;

    ctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.beginPath();

    for (let i = 0; i < MAX_SIZE; i++) {
        cty = map[chromo.getData(i)];

        if (i == 0)
            ctx.moveTo(cty[0], cty[1]);
        else
            ctx.lineTo(cty[0], cty[1]);

        if (!swapped && i >= MAX_SIZE / 2) {
            swapped = true;

            distA = acum;
            acum = getDistance(chromo.getData(i), chromo.getData(i+1), map);

            ctx.stroke();
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        }
        else if ((!swapped && i >= MAX_SIZE / 2 - 1) || (i == MAX_SIZE - 1)) {
            acum += getDistanceOfSelf(chromo.getData(i), map);
        }
        else {
            acum += getDistance(chromo.getData(i), chromo.getData(i+1), map);
        }

        ctx.lineTo(cty[2], cty[3]);
    }

    distB = acum;
    ctx.stroke();

    console.log('Separate: ' + distA.toFixed(2) + ', ' + distB.toFixed(2));
}

// class declaration for cChromosome
function cChromosome()
{
    //Private Member Variables
    var mData = new Array(MAX_SIZE);
    var mRegion = 0;
    var mTotal = 0.0;
    var mTotalA = 0.0;
    var mTotalB = 0.0;
    var mFitness = 0.0;
    var mSelected = false;
    var mAge = 0;
    var mSelectionProbability = 0.0;

    //Public Method Pointers
    this.getSelectionProbability = getSelectionProbability;
    this.setSelectionProbability = setSelectionProbability;
    this.getAge = getAge;
    this.setAge = setAge;
    this.getSelected = getSelected;
    this.setSelected = setSelected;
    this.getFitness = getFitness;
    this.setFitness = setFitness;
    this.getTotal = getTotal;
    this.setTotal = setTotal;
    this.getTotalSeparate = getTotalSeparate;
    this.setTotalSeparate = setTotalSeparate;
    this.getRegion = getRegion;
    this.setRegion = setRegion;
    this.getData = getData;
    this.setData = setData;

    //Public Methods
    function getSelectionProbability()
    {
        return mSelectionProbability;
    }
    function setSelectionProbability(SelProb)
    {
        mSelectionProbability = SelProb;
    }

    function getAge()
    {
        return mAge;
    }
    function setAge(Epochs)
    {
        mAge = Epochs;
    }

    function getSelected()
    {
        return mSelected;
    }
    function setSelected(sValue)
    {
        mSelected = sValue;
    }

    function getFitness()
    {
        return mFitness;
    }
    function setFitness(Score)
    {
        mFitness = Score;
    }

    function getTotal()
    {
        return mTotal;
    }
    function setTotal(Value)
    {
        mTotal = Value;
    }

    function getTotalSeparate()
    {
        return { A: mTotalA, B: mTotalB };
    }
    function setTotalSeparate(Value)
    {
        mTotalA = Value.A;
        mTotalB = Value.B;
    }

    function getRegion()
    {
        return mRegion;
    }
    function setRegion(RegionNumber)
    {
        mRegion = RegionNumber;
    }

    function getData(Index)
    {
        return mData[Index];
    }
    function setData(Index, Value)
    {
        mData[Index] = Value;
    }
}

function initializeChromosomes(population, map)
{
    for (let ic = 0; ic < START_SIZE; ic++) {
        var newChromo = new cChromosome();

        for (let jc = 0; jc < MAX_SIZE; jc++)
            newChromo.setData(jc, jc);

        population.push(newChromo);

        exchangeMutation(population.length - 1, getRandomNumber(MIN_SHUFFLES, MAX_SHUFFLES), population);

        getTotalDistance(population.length - 1, population, map);
    }
}

function fitness(population)
{
//Lowest errors = 100%, Highest errors = 0%
    var popSize = 0;
    var thisChromo = new cChromosome();
    var bestScore = 0.0;
    var worstScore = 0.0;

    popSize = population.length;

    //The worst score would be the one furthest from the Target.
    thisChromo = population[maximum(population)];
    worstScore = Math.abs(-thisChromo.getTotal());

    //Convert to a weighted percentage.
    thisChromo = population[minimum(population)];
    bestScore = worstScore - Math.abs(-thisChromo.getTotal());

    for (let g = 0; g < popSize; g++) {
        thisChromo = population[g];
        thisChromo.setFitness((worstScore - (Math.abs(-thisChromo.getTotal()))) * 100 / bestScore);
    }
}

function rouletteSelection(population)
{
    var jr = 0;
    var popSize = 0;
    var genTotal = 0.0;
    var selTotal = 0.0;
    var maximumToSelect = 0;
    var rouletteSpin = 0.0;
    var thisChromo = new cChromosome();
    var thatChromo = new cChromosome();
    var done = false;

    popSize = population.length;

    for (let ir = 0; ir < popSize; ir++) {
        thisChromo = population[ir];
        genTotal += thisChromo.getFitness();
    }

    genTotal *= 0.01;

    for (let ir = 0; ir < popSize; ir++) {
        thisChromo = population[ir];
        thisChromo.setSelectionProbability(thisChromo.getFitness() / genTotal);
    }

    maximumToSelect = getRandomNumber(MIN_SELECT, MAX_SELECT);

    for (let ir = 0; ir < maximumToSelect; ir++) {
        rouletteSpin = getRandomNumber(0, 99);
        jr = 0;
        selTotal = 0;
        done = false;

        do {
            thisChromo = population[jr];
            selTotal += thisChromo.getSelectionProbability();

            if (selTotal >= rouletteSpin) {
                if (jr == 0)
                    thatChromo = population[jr];
                else if (jr >= popSize - 1)
                    thatChromo = population[popSize - 1];
                else
                    thatChromo = population[jr - 1];

                thatChromo.setSelected(true);
                done = true;
            }
            else
                jr += 1;

        } while (!done);
    }
}

function mating(population, map)
{
    var popSize = 0;
    var getRand = 0;
    var parentA = 0;
    var parentB = 0;
    var thisChromo = new cChromosome();
    var thatChromo = new cChromosome();

    for (let im = 0; im < O_RATE; im++) {
        parentA = chooseParentA(population);
        //Test probability of mating.
        getRand = getRandomNumber(0, 100);
        
        if (getRand <= R_RATE * 100) {
            parentB = chooseParentB(parentA, population);
            var newChromo = new cChromosome();
            population.push(newChromo);

            partiallyMappedCrossover(parentA, 
                                     parentB, 
                                     population.length - 1, 
                                     population);

            if (childCount == nextMutation) {
                getRand = getRandomNumber(0, MAX_SIZE - 1);
                exchangeMutation(population.length - 1, 1, population);
            }

            getTotalDistance(population.length - 1, population, map);

            childCount += 1;

            //Schedule next mutation.
            if (childCount % (1 / M_RATE) == 0)
                nextMutation = childCount + getRandomNumber(0, (1 / M_RATE));
        }
    }
}

function chooseParentA(population)
{
    var parent = 0;
    var thisChromo = new cChromosome();
    var done = false;

    do {
        parent = getRandomNumber(0, population.length - 1);
        thisChromo = population[parent];

        if (thisChromo.getSelected() == true)
            done = true;
    } while(!done);

    return parent;

}

function chooseParentB(parentA, population)
{
    var parent = 0;
    var thisChromo = new cChromosome();
    var done = false;
    var popSize = population.length - 1;
    
    do {
        parent = getRandomNumber(0, popSize);
        if (parent != parentA) {
            thisChromo = population[parent];

            if (thisChromo.getSelected() == true)
                done = true;
        }
    } while (!done);

    return parent;
}

function partiallyMappedCrossover(chromA, chromB, childIndex, population)
{
    var k = 0;
    var crossPoint1 = 0;
    var crossPoint2 = 0;
    var item1 = 0;
    var item2 = 0;
    var pos1 = 0;
    var pos2 = 0;
    var thisChromo = new cChromosome();
    var thatChromo = new cChromosome();
    var newChromo = new cChromosome();

    thisChromo = population[chromA];
    thatChromo = population[chromB];
    newChromo = population[childIndex];

    crossPoint1 = getRandomNumber(0, MAX_SIZE - 1);
    crossPoint2 = getRandomNumber(0, MAX_SIZE - 1, crossPoint1);
    if (crossPoint2 < crossPoint1) {
        k = crossPoint1;
        crossPoint1 = crossPoint2;
        crossPoint2 = k;
    }

    //Copy ParentA genes to offspring.
    for (let i = 0; i < MAX_SIZE; i++)
        newChromo.setData(i, thisChromo.getData(i));

    for (let i = crossPoint1; i <= crossPoint2; i++) {
        //Get the two items to swap.
        item1 = thisChromo.getData(i);
        item2 = thatChromo.getData(i);

        //Get the items' positions in the offspring.
        for (let j = 0; j < MAX_SIZE; j ++)
        {
            if (newChromo.getData(j) == item1)
                pos1 = j;
            else if (newChromo.getData(j) == item2)
                pos2 = j;
        }

        //Swap them.
        if (item1 != item2) {
            newChromo.setData(pos1, item2);
            newChromo.setData(pos2, item1);
        }
    }
}

function exchangeMutation(index, exchanges, population)
{
    var e = 0;
    var tempData = 0;
    var thisChromo = new cChromosome();
    var gene1 = 0;
    var gene2 = 0;
    var done = false;

    thisChromo = population[index];
    e = 0;

    do {
        gene1 = getRandomNumber(0, MAX_SIZE - 1);
        gene2 = getRandomNumber(0, MAX_SIZE - 1, gene1);

        //Exchange the chosen genes.
        tempData = thisChromo.getData(gene1);
        thisChromo.setData(gene1, thisChromo.getData(gene2));
        thisChromo.setData(gene2, tempData);

        if (e == exchanges)
            done = true;

        e += 1;
    } while (!done);

    mutations += 1;

}

function prepNextEpoch(population)
{
    var i = 0;
    var popSize = 0;
    var thisChromo = new cChromosome();

    //Reset flags for selected individuals.
    popSize = population.length;
    
    for (let i = 0; i < popSize; i++) {
        thisChromo = population[i];
        thisChromo.setSelected(false);
    }
}

function getTotalDistance(chromoIndex, population, map)
{
    for (let id = 0; id < MAX_SIZE; id++) {
        if (id == MAX_SIZE - 1)
            population[chromoIndex].setTotal(population[chromoIndex].getTotal() + getDistanceOfSelf(population[chromoIndex].getData(id), map));
        else
            population[chromoIndex].setTotal(population[chromoIndex].getTotal() + getDistance(population[chromoIndex].getData(id), population[chromoIndex].getData(id + 1), map));
    }
}

function getDistance(firstCity, secondCity, map)
{
    var CityA = map[firstCity];
	var CityB = map[secondCity];

	var distA = getDistanceOfSelf(firstCity, map);

	var dx = CityB[0] - CityA[2];
	var dy = CityB[1] - CityA[3];

	var distB = Math.sqrt((dx * dx) + (dy * dy));

	return distA + distB;
}

function getDistanceOfSelf(city, map)
{
    var c = map[city];

    var dx = c[2] - c[0];
    var dy = c[3] - c[1];

    return Math.sqrt((dx * dx) + (dy * dy));
}

function minimum(population)
{
    var popSize = 0;
    var thisChromo = new cChromosome();
    var thatChromo = new cChromosome();
    var winner = 0;
    var foundNewWinner = false;
    var done = false;

    winner = 0;

    do {
        foundNewWinner = false;
        popSize = population.length;
        
        for (let h = 0; h < popSize; h++) {
            if (h != winner) {             //Avoid self-comparison.
                thisChromo = population[h];
                thatChromo = population[winner];

                //The minimum has to be in relation to the Target.
                if (Math.abs(-thisChromo.getTotal()) < Math.abs(-thatChromo.getTotal())) {
                    winner = h;
                    foundNewWinner = true;
                }
            }
        }

        if(foundNewWinner == false)
            done = true;
    } while (!done);

    if (population[winner].getTotal() < bestDist || bestDist < 0) {
    	bestDist = population[winner].getTotal();
    	bestChromo = population[winner];
    }

    return winner;
}

function maximum(population)
{
    var popSize = 0;
    var thisChromo = new cChromosome();
    var thatChromo = new cChromosome();
    var winner = 0;
    var foundNewWinner = false;
    var done = false;

    winner = 0;

    do {
        foundNewWinner = false;
        popSize = population.length;
        
        for (let k = 0; k < popSize; k++) {
            if (k != winner) {             //Avoid self-comparison.
                thisChromo = population[k];
                thatChromo = population[winner];
                
                //The maximum has to be in relation to the Target.
                if (Math.abs(-thisChromo.getTotal()) >  Math.abs(-thatChromo.getTotal())) {
                    winner = k;
                    foundNewWinner = true;
                }
            }
        }

        if (foundNewWinner == false)
            done = true;
    } while (!done);

    return winner;
}


function getRandomNumber(low, high)
{
    return Math.round(low + (high-low) * Math.random());
}

function getRandomNumber(low, high, except)
{
    var done = false;
    var getRand = 0;

    do {
        getRand = Math.round(low + (high-low) * Math.random());
        
        if (getRand != except)
            done = true;
    } while (!done);

    return getRand;
}

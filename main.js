//Global definitions and functions
const margin = {top: 125, right: 150, bottom: 125, left: 150},
width = 1500 - margin.left - margin.right,
height = 750 - margin.top - margin.bottom;
const R = 13;
const duration = 1000;
const plotColor = "rgb(81, 170, 232)";

const getDate = (d) => {
  let albumDate = new Date(d);
  return albumDate.setFullYear(albumDate.getUTCFullYear())
};

const getDisplayDate = (d) => {
  let albumDate = new Date(d);
  return albumDate.getFullYear();
}

const labels = {
  popularity: "Spotify Popularity",
  grammys: "Grammy Wins",
  percent: "Percent Rap",
  speech: "Spotify Speechiness",
}

const getStemPosition = (d, i) =>  {
  const even = i % 2 === 0;
  let songDate = new Date(d);
  const addedDays = even ? 45 : - 45;
  const result = songDate.setDate(songDate.getDate() + addedDays);
  return result;
}
const player = document.getElementById('player')

player.onpause = function () {
  const allElements = document.querySelectorAll('*');
  allElements.forEach((element) => {
    element.classList.remove('reverb')
    element.classList.remove('pulsing')
    element.classList.remove('playing')
  })


}
const clicked = (event, d) => {
  const currentRing = document.querySelector(".reverb")
  const currentAlbum = document.querySelector(".pulsing")
  let selected;
  const playing = d3.selectAll(".playing")

  // album animation behavior
  if (d.ring) {
    playing.classed("playing", false)
    const ring = event.target
    ring.classList.add("reverb")
    selected = event.target.parentNode
    selected.classList.add("pulsing")

    if (d.src != "" && player.src != d.src) {
      player.src = d.src;
      player.play();
    } else {
      player.src = "";
      selected.classList.remove("pulsing");
      ring.classList.remove("reverb")
      player.pause();
    }
  } else { // song animation behavior
    playing.classed("playing", false)
    selected = event.target.parentNode
    selected.classList.add("playing")
    if (d.src != "" && player.src != d.src) {
      player.src = d.src;
      player.play();
    } else {
      player.src = "";
      selected.classList.remove("playing")
      player.pause();
    }
  }
  currentRing.classList.remove("reverb")
  if (currentAlbum !== selected) {
    currentAlbum.classList.remove("pulsing")
  }
  event.stopPropagation();
};

const svg = d3.select("#container")
  .append("svg").attr("class", "viz")
  .attr("viewBox", `0 0 1500 750`)
  .append("g")
  .attr("transform",`translate(${margin.left}, ${margin.top})`);

const dates = data.map((elem) => getDate(elem.release_date))
const pops = data.map((elem) => elem.popularity)

const [minDate, maxDate] = d3.extent(dates)
const adjustedMin = getStemPosition(minDate)
// Add X axis for first viz
const x = d3.scaleLinear()
  .domain([adjustedMin, maxDate])
  .range([ 0, width ]);

svg.append("g")
  .attr("transform", `translate(0, ${height})`)
  .call(d3.axisBottom(x).ticks(10).tickPadding(15).tickFormat(d3.timeFormat("%Y")));

//axis labels
svg.append("text")
  .attr("class", "x-label")
  .attr("x", width / 2.25)
  .attr("y", height + 85)
  .text("Date of Album Release")
  .style("opacity", 1)
  .style("font-size", '20px')

svg.append("text")
  .attr("class", "y-label")
  .attr("x", 0)
  .attr("y", -75)
  .attr("transform", `translate(20,${height / 1.5}) rotate(270)`)
  .text("Spotify Popularity")
  .style("opacity", 1)
  .style("font-size", '20px')


// Add Y axis for first viz
const y = d3.scaleLinear()
  .domain(d3.extent(pops))
  .range([height, 0]);

svg.append("g").attr("class", "y-axis")
  .call(d3.axisLeft(y).tickPadding(10).ticks(1));

const tooltip = d3.select("#container").select(".tooltip");

// change handler for first viz dropdown menu
const updateAlbums = () => {
  const metric = document.getElementById('albumMetric').value;
  drawAlbums(getManipulatedData(metric), metric)
}

const getManipulatedData = (metric) => {
  return data.map((d) => {
    return {
      release_date: d.release_date,
      metric: d[metric],
      info: d.info,
      album_art: d.album_art,
      name: d.name,
      label: labels[metric],
      ring: d.ring
    }
  });
}

// draw album viz
const drawAlbums = (refinedData, metric) => {
  const metricPops = refinedData.map((elem) => elem.metric)

  const [min, max] = d3.extent(metricPops)
  // reset & transition y axis & labels
  y.domain([min-5, max+5])

  d3.select("g.y-axis").transition().duration(duration)
    .call(d3.axisLeft(y))

  d3.select(".y-label").text(labels[metric]).transition().duration(duration)

  const g = svg
    .selectAll(".dot")
    .data(refinedData, (d) => d.name)
    .join(
      (enter) => {
        const g = enter.append("g").attr("class", "dot").attr("opacity", 0);
        g.transition().duration(duration).attr("opacity", 1);

        //apply x, y positions to the whole group as opposed to the individual circle/rings
        g.attr("transform", (d) => `translate(${x(getDate(d.release_date))}, ${y(d.metric)})`)

        // create initial plot points for albums
        g.append("circle")
          .attr("class", "center")
          .attr("r", (d) => R)
          .style("fill", plotColor)
          .on("mouseover", (evt, d) => {
            const tooltipText = `
            <strong>${d.name}</strong>
            <img class='profile' src='${d.album_art.src}'>
            <span>Tracks Rapped: ${d.info.length}</span>
            <span>${d.label}: ${d.metric} </span>
            <span>Year: ${getDisplayDate(d.release_date)}</span>`;
            tooltip
              .style("top", `${evt.pageY - 225}px`)
              .style("left", `${evt.pageX - 50}px`)
              .style("color", "#000")
              .style("opacity", 1)
              .html(tooltipText);
          })
          .on("mouseout", () => tooltip.text("").style("opacity", 0));

        //creating rings
        g.selectAll("circle.ring")
          .data((d) => d.info)
          .join("circle")
          .attr("r", (d, i) => 10 * i + 20)
          .style("stroke", plotColor)
          .style("fill", "none")
          .attr("class", "ring")
          .on("mousemove", (evt, d) => {
            const [mx, my] = d3.pointer(evt);
            const tooltipText = `<strong> Track: ${d.song}</strong>`;
            tooltip
              .style("top", `${evt.pageY - 50}px`)
              .style("left", `${evt.pageX - 50}px`)
              .style("opacity", 1)
              .style("color", "#000")
              .html(tooltipText);
          })
          .on("mouseout", () =>
            tooltip
              .text("")
              .style("background", "white")
              .style("color", "#000")
              .style("opacity", 0)
          )
          .on("click", clicked);
          return g
    },
    (update) => {
        update.call(g => g.select('circle.center')
        .on("mouseover", (evt, d) => {
            const tooltipText = `
            <strong>${d.name}</strong>
            <img class='profile' src='${d.album_art.src}'>
            <span>Tracks Rapped: ${d.info.length}</span>
            <span>${d.label}: ${d.metric} </span>
            <span>Year: ${getDisplayDate(d.release_date)}</span>`;
            tooltip
              .style("top", `${evt.pageY - 225}px`)
              .style("left", `${evt.pageX - 50}px`)
              .style("color", "#000")
              .style("opacity", 1)
              .html(tooltipText);
        })
        .on("mouseout", () => tooltip.text("").style("opacity", 0))
      )
      return update.transition().duration(duration).attr("transform", (d) => `translate(${x(getDate(d.release_date))}, ${y(d.metric)})`)
    },
    (exit) => {
      return exit.transition().duration(duration).attr("opacity", 0).remove();
    }
  );
}
  // End album viz

// Start mixed viz
const all = d3.select("#container2")
  .append("svg").attr("class", "viz")
    .attr("viewBox", `0 0 1500 750`)
  .append("g")
    .attr("transform",`translate(${margin.left}, ${margin.top})`);

const dates2 = allData.map((elem) => getDate(elem.release_date))
const pops2 = allData.map((elem) => elem.popularity)
const tooltip2 = d3.select(container2).select(".tooltip2");
const [minDate2, maxDate2] =d3.extent(dates2)
// Add X axis for second viz
const x2 = d3.scaleLinear()
  .domain([getStemPosition(minDate2), maxDate2])
  .range([ 0, width ]);

all.append("g")
  .attr("transform", `translate(0, ${height})`)
  .call(d3.axisBottom(x2).ticks(20).tickPadding(10).tickFormat(d3.timeFormat("%Y")));

// Add Y axis for second viz
const y2 = d3.scaleLinear()
  .domain(d3.extent(pops2))
  .range([ height, 0]);

all.append("g").attr("class", "y-axis2")
  .call(d3.axisLeft(y2).tickPadding(10));

// axis labels
all.append("text")
  .attr("class", "x-label")
  .attr("x", width / 2)
  .attr("y", height + 80)
  .text("Date of Release")
  .style("opacity", 1)
  .style("font-size", '20px')

all.append("text")
  .attr("class", "y-label2")
  .attr("x", 0)
  .attr("y", -75)
  .attr("transform", `translate(20,${height / 1.5}) rotate(270)`)
  .text("Spotify Popularity")
  .style("opacity", 1)
  .style("font-size", '20px')


const updateMix = () => {
  const mixMetric = document.getElementById('mixMetric').value;
  drawMixed(getMixData(mixMetric), mixMetric)
}

const getMixData = (metric) => {
  const length = -50
  return allData.map((d) => {
    return {
      release_date: d.release_date,
      metric: d[metric],
      info: d.info,
      album_art: d.album_art,
      name: d.name,
      label: labels[metric],
      album: d.album,
      stemLength: length,
      src: d.src,
      ring: d.ring
    }
  });
}

const drawMixed = (updatedData, metric) => {
  const mixedPops = updatedData.map((elem) =>elem.metric)

  // reset y axis

  const [min, max] = d3.extent(mixedPops)
  y2.domain([min-5, max+5])
  d3.select("g.y-axis2").transition().duration(duration)
    .call(d3.axisLeft(y2))
  d3.select(".y-label2").text(labels[metric]).transition().duration(duration)

  const albums = all
    .selectAll(".albums")
    .data(updatedData, (d) => d.name)
    .join(
      (enter) => {
        const albums = enter.append("g").attr("class", "albums").attr("opacity", 0);
        albums.transition().duration(duration).attr("opacity", 1);

        //apply x, y positions to the whole group as opposed to the individual circle/rings
        albums.attr("transform", (d) => `translate(${x2(getDate(d.release_date))}, ${y2(d.metric)})`)

        // create initial plot points for albums
        albums.append("circle")
          .attr("class", (d) => !d.album ? "music" : "center")
          .attr("r", (d) => d.album ? R : 8)
          .style("fill", (d) => !d.album ? "#ff477e" : plotColor)
          .style("opacity",  (d) => d.album ? 1 : 0.6)
          .on("mouseover", (evt, d) => {
            const tooltipText2 = d.album ? `
            <strong>${d.name}</strong>
            <img class='profile' src='${d.album_art.src}'>
            <span>Tracks Rapped: ${d.info.length}</span>
            <span>${d.label}: ${d.metric} </span>
            <span>Year: ${getDisplayDate(d.release_date)}</span>`
              : `<strong> Single: ${d.name}</strong>
                 <span>${d.label}: ${d.metric} </span>
                 <span>Year: ${getDisplayDate(d.release_date)}</span>`;
            tooltip2
              .style("top", `${evt.pageY - 75}px`)
              .style("left", `${evt.pageX - 30}px`)
              .style("opacity", 1)
              .html(tooltipText2);
          })
          .on("mouseout", () => tooltip2.text("").style("opacity", 0))
          .on("click", clicked);

        // //creating rings
        albums.selectAll("circle.ring")
          .data((d) => d.info)
          .join("circle")
          .attr("r", (d, i) => 10 * i + 20)
          .style("stroke", plotColor)
          .style("fill", "none")
          .attr("class", "ring")
          .on("mouseenter", (evt, d) => {
            const tooltipText2 = `<strong> Track: ${d.song}</strong>`;
            tooltip2
              .style("top", `${evt.pageY - 75}px`)
              .style("left", `${evt.pageX - 30}px`)
              .style("opacity", 1)
              .html(tooltipText2);
          })
          .on("mouseout", () =>
            tooltip2
              .text("")
              .style("background", "white")
              .style("color", plotColor)
              .style("opacity", 0)
          )
          .on("click", clicked);

        albums.append('line')
          .attr("class", "stem")
          .style('opacity', .5)
          .style("visibility",(d)=>  d.album ? "hidden" : "visible")
          .attr("stroke", "#ff477e")
          .attr("y2",(d, i) =>  i % 2 === 0 ? 40 : -40)
          .attr("x1",  (d, i ) => i % 2 === 0 ? -7 : 7)
          .attr("x2", (d, i) => i % 2 === 0 ? -7 : 7)
          .on("mouseover", (evt, d) => {
            const tooltipText2 = `
              <strong> Single: ${d.name}</strong>
              <span>${d.label}: ${d.metric} </span>
              <span>Year: ${getDisplayDate(d.release_date)}</span>`;
              tooltip2
                .style("top", `${evt.pageY - 75}px`)
                .style("left", `${evt.pageX - 30}px`)
                .style("opacity", 1)
                .html(tooltipText2);
            })
          .on("mouseout", () => tooltip2.text("").style("opacity", 0))
          .on("click", clicked);

        return albums
    },
      (update) => {
        update.call(g => g.select('circle.center')
          .on("mouseover", (evt, d) => {
            const tooltipText2 = d.album
              ? `
              <strong>${d.name}</strong>
              <img class='profile' src='${d.album_art.src}'>
              <span>Tracks Rapped: ${d.info.length}</span>
              <span>${d.label}: ${d.metric} </span>
              <span>Year: ${getDisplayDate(d.release_date)}</span>`
                : `<strong> Single: ${d.name}</strong>
                  <span>${d.label}: ${d.metric} </span>
                  <span>Year: ${getDisplayDate(d.release_date)}</span>`;
              tooltip2
              .style("top", `${evt.pageY - 75}px`)
              .style("left", `${evt.pageX - 30}px`)
                .style("opacity", 1)
                .html(tooltipText2);
            })
          .on("mouseout", () => tooltip2.text("").style("opacity", 0))
        )
        update.call(g => g.select('circle.music')
          .on("mouseover", (evt, d) => {
            const tooltipText2 = d.album
              ? `
              <strong>${d.name}</strong>
              <img class='profile' src='${d.album_art.src}'>
              <span>Tracks Rapped: ${d.info.length}</span>
              <span>${d.label}: ${d.metric} </span>
              <span>Year: ${getDisplayDate(d.release_date)}</span>`
                : `<strong> Single: ${d.name}</strong>
                  <span>${d.label}: ${d.metric} </span>
                  <span>Year: ${getDisplayDate(d.release_date)}</span>`;
              tooltip2
              .style("top", `${evt.pageY - 75}px`)
              .style("left", `${evt.pageX - 30}px`)
                .style("opacity", 1)
                .html(tooltipText2);
            })
          .on("mouseout", () => tooltip2.text("").style("opacity", 0))
        )
        return update.transition().duration(duration)
        .attr("transform", (d) => `translate(${x2(getDate(d.release_date))}, ${y2(d.metric)})`)
      },
    (exit) => {
      return exit.transition().duration(duration).attr("opacity", 0).remove();
    }
  );
}

// notes only viz,
const songs = d3.select("#container3")
  .append("svg").attr("class", "viz").attr("viewBox", `0 0 1500 750`)
  .append("g").attr("transform",`translate(${margin.left}, ${margin.top})`);

const dates3 = songData.map((elem) => getDate(elem.release_date))
const pops3 = songData.map((elem) => elem.popularity)

// Add X axis for second viz

const [minDate3, maxDate3] = d3.extent(dates3);
const x3 = d3.scaleLinear()
  .domain([getStemPosition(minDate3), maxDate3])
  .range([0, width]);

songs.append("g")
  .attr("transform", `translate(0, ${height})`)
  .call(d3.axisBottom(x3).tickPadding(10).tickFormat(d3.timeFormat("%Y")));

songs.append("text")
  .attr("class", "x-label")
  .attr("x", width / 2)
  .attr("y", height + 60)
  .text("Date of Release")
  .style("opacity", 1)
  .style("font-size", "20px");

songs.append("text")
  .attr("class", "y-label3")
  .attr("x", 0)
  .attr("y", -75)
  .attr("transform", `translate(20,${height / 1.5}) rotate(270)`)
  .text("Spotify Popularity")
  .style("opacity", 1)
  .style("font-size", "20px");

// Add Y axis for second viz
const y3 = d3.scaleLinear()
  .domain(d3.extent(pops3))
  .range([height, 0]);

songs.append("g").attr("class", "y-axis3")
  .call(d3.axisLeft(y3).tickPadding(5));

const tooltip3 = d3.select(container3).select(".tooltip3");

const updateSongs = () => {
  const songMetric = document.getElementById('songMetric').value;
  drawSongs(getSongData(songMetric), songMetric)
}

const getSongData = (metric) => {
  return songData.map((d) => {
    return {
      release_date: d.release_date,
      metric: d[metric],
      name: d.name,
      label: labels[metric],
      rap: d.rap,
      src: d.src,
      ring: d.ring
    }
  });
}

const drawSongs = (refinedSongs, metric) => {
  const songPops = refinedSongs.map((elem) =>elem.metric)
  // reset y axis

  y3.domain(d3.extent(songPops))
  d3.select("g.y-axis3")
    .transition()
    .duration(duration)
    .call(d3.axisLeft(y3))

  d3.select(".y-label3")
    .text(labels[metric])
    .transition()
    .duration(duration)

  const chart = songs
    .selectAll(".notes")
    .data(refinedSongs, (d) => d.name)
    .join(
      (enter) => {
        const notes = enter.append("g").attr("class", "notes").attr("opacity", 0);
        notes.transition().duration(duration).attr("opacity", 1);

        notes.attr("transform", (d) => `translate(${x3(getDate(d.release_date))}, ${y3(d.metric)})`)

        // create initial plot points for notes
        notes.append("circle")
          .attr("class", (d) => d.rap ? "center" : "altCenter")
          .attr("r", 8)
          .style("fill", (d) => d.rap ? plotColor : "#ff477e")
          .style("opacity", 0.6)
          .on("mouseover", (evt, d) => {
            const tooltipText3 = `
            <strong>${d.name}</strong>
            <span>${d.label}: ${d.metric} </span>
            <span>Year: ${getDisplayDate(d.release_date)}</span>`;
            tooltip3
              .style("top", `${evt.pageY - 75}px`)
              .style("left", `${evt.pageX - 30}px`)
              .style("opacity", 1)
              .html(tooltipText3);
          })
          .on("mouseout", () => tooltip3.text("").style("opacity", 0))
          .on("click", clicked);

        notes.append('line')
          .attr("class", "stem")
          .attr("stroke", (d) => d.rap ? plotColor: "#ff477e")
          .attr("y2", (d, i) => i % 2 === 0 ? 45 : -45)
          .attr("x1", (d, i ) => i % 2 === 0 ?  -8 : 8)
          .attr("x2",(d, i ) => i % 2 === 0 ?  -8 : 8)
          .on("mouseover", (evt, d) => {
            const tooltipText3 = `
            <strong>${d.name}</strong>
            <span>${d.label}:${d.metric} </span>
            <span>Year: ${getDisplayDate(d.release_date)}</span>`;

            tooltip3
              .style("top", `${evt.pageY - 75}px`)
              .style("left", `${evt.pageX - 30}px`)
              .style("opacity", 1)
              .html(tooltipText3);
          })
          .on("mouseout", () => tooltip3.text("").style("opacity", 0))
          .on("click", clicked);

          return notes
      },
      (update) => {
         update.call(g => g.select('circle.center')
          .on("mouseover", (evt, d) => {
              const tooltipText3 =`
              <strong>${d.name}</strong>
              <span>${d.label}: ${d.metric} </span>
              <span>Year: ${getDisplayDate(d.release_date)}</span>`;
              tooltip3
              .style("top", `${evt.pageY - 75}px`)
              .style("left", `${evt.pageX - 30}px`)
                .style("opacity", 1)
                .html(tooltipText3);
            })
          .on("mouseout", () => tooltip3.text("").style("opacity", 0))
         )
        update.call(g => g.select('circle.altCenter')
          .on("mouseover", (evt, d) => {
              const tooltipText3 =`
              <strong>${d.name}</strong>
              <span>${d.label}: ${d.metric} </span>
              <span>Year: ${getDisplayDate(d.release_date)}</span>`;
              tooltip3
              .style("top", `${evt.pageY - 75}px`)
              .style("left", `${evt.pageX - 30}px`)
                .style("opacity", 1)
                .html(tooltipText3);
            })
          .on("mouseout", () => tooltip3.text("").style("opacity", 0))
        )
        update.call(g => g.select('line.stem')
          .on("mouseover", (evt, d) => {
              const tooltipText3 =`
              <strong>${d.name}</strong>
              <span>${d.label}: ${d.metric} </span>
              <span>Year: ${getDisplayDate(d.release_date)}</span>`;
              tooltip3
              .style("top", `${evt.pageY - 75}px`)
              .style("left", `${evt.pageX - 30}px`)
                .style("opacity", 1)
                .html(tooltipText3);
            })
          .on("mouseout", () => tooltip3.text("").style("opacity", 0))
        )
        update.call(g => g.select('line.altStem')
          .on("mouseover", (evt, d) => {
              const tooltipText3 =`
              <strong>${d.name}</strong>
              <span>${d.label}: ${d.metric} </span>
              <span>Year: ${getDisplayDate(d.release_date)}</span>`;
              tooltip3
                .style("top", `${evt.pageY - 75}px`)
                .style("left", `${evt.pageX - 30}px`)
                .style("opacity", 1)
                .html(tooltipText3);
            })
          .on("mouseout", () => tooltip3.text("").style("opacity", 0))
        )

        return update.transition().duration(duration)
        .attr("transform", (d) => `translate(${x3(getDate(d.release_date))}, ${y3(d.metric)})`)
      },
      (exit) => {
        return exit.transition().duration(duration).attr("opacity", 0).remove();
      }
  );

     meanLine
      .raise()
      .transition()
      .attr("x1", x3(getDate("2001-06-21T00:00:00")))
      .attr("y1", y3(.33))
      .attr("x2", x3(getDate("2022-012-21T00:00:00")))
      .attr("y2", y3(.33));
}

// billboard  data viz
const billboard = d3.select("#container4")
  .append("svg")
  .attr("class", "viz")
  .attr("viewBox", `0 0 1500 750`)
  .append("g")
  .attr("transform",`translate(${margin.left}, ${margin.top})`);

const dates4 = billboardData.map((elem) => getDate(elem.chart_debut))
const pops4 = billboardData.map((elem) => elem.peak_position)

const [minDate4, maxDate4] = d3.extent(dates4)
// Add X axis
const x4 = d3.scaleLinear()
  .domain([getStemPosition(minDate4), maxDate4])
  .range([0, width]);

billboard.append("g")
  .attr("transform", `translate(0, ${height})`)
  .call(d3.axisBottom(x4).tickPadding(10).tickFormat(d3.timeFormat("%Y")));

billboard.append("text")
  .attr("class", "x-label")
  .attr("x", width / 2.25)
  .attr("y", height + 80)
  .text("Billboard Debut Date")
  .style("opacity", 1)
  .style("font-size", "20px");

billboard.append("text")
  .attr("class", "y-label")
  .attr("x", 0).attr("y", -75)
  .attr("transform", `translate(20,${height / 1.5}) rotate(270)`)
  .text("Peak Chart Position")
  .style("opacity", 1)
  .style("font-size", "20px");

// Add Y axis
const y4 = d3.scaleLinear()
  .domain(d3.extent(pops4).reverse())
  .range([height, 0]);

billboard.append("g")
  .call(d3.axisLeft(y4).tickPadding(10));

const tooltip4 = d3.select(container4).select(".tooltip4")

const appearance = billboard.selectAll("g.unit").data(billboardData).join("g").attr("class", "unit");

appearance
  .append("circle")
  .attr("cx", (d) => x4(getDate(d.chart_debut)))
  .attr("cy", (d) => y4(d.peak_position))
  .attr("r", 8)
  .style("fill", (d) => (d.rap === "TRUE" ? plotColor : "#ff477e"))
  .style("opacity", 0.6)
  .attr("class", (d) => d.rap ==="TRUE" ? "center" : "music")
  .on("mouseenter", (evt, d) => {
    const tooltipText4 = `
      <strong> ${d.song}</strong>
      <span>Peak Position: ${d.peak_position}</span>
      <span>Year: ${getDisplayDate(d.chart_debut)}</span>`;
    tooltip4
      .style("top", `${evt.pageY - 75}px`)
      .style("left", `${evt.pageX - 30}px`)
      .style("opacity", 1)
      .html(tooltipText4);
  })
  .on("mouseout", () => tooltip4.text("").style("opacity", 0))
  .on("click", clicked);

// draw music note stems
appearance
  .append("line")
  .attr("y1", (d, i) => y4(d.peak_position))
  .attr("y2", (d, i) =>
    y4(i % 2 === 0 ? d.peak_position - 8 : d.peak_position + 8)
  )
  .attr("x1", (d, i) => x4(getStemPosition(d.chart_debut, i)))
  .attr("x2", (d, i) => x4(getStemPosition(d.chart_debut, i)))
  .attr("stroke", (d) => (d.rap === "TRUE" ? plotColor : "#ff477e"))
  .attr("class", "stem")
  .on("mouseenter", (evt, d) => {
    const tooltipText4 = `
      <strong> ${d.song}</strong>
      <span>Peak Position: ${d.peak_position}</span>
      <span>Year: ${getDisplayDate(d.chart_debut)}</span>`;
    tooltip4
      .style("top", `${evt.pageY - 75}px`)
      .style("left", `${evt.pageX - 35}px`)
      .style("opacity", 1)
      .html(tooltipText4);
  })
  .on("mouseout", () => tooltip4.text("").style("opacity", 0))
  .on("click", clicked);

const renderAllCharts = async () => {
  // calls all 3 functions at the same time
  try {
    updateAlbums()
    updateMix()
    updateSongs()
  } catch (err) {
    console.log(err)
  }
}

renderAllCharts()



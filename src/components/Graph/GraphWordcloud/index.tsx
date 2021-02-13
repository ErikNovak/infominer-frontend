// import interfaces
import { IGraphWordcloud, IKeyword } from "Interfaces";
// import modules
import React, { useRef, useState, useEffect } from "react";
import classnames from "classnames";
// import d3 visualization
import * as d3 from "d3";
import cloud from "d3-cloud";

// import styles
import styles from "./styles.module.scss";

export default function GraphKeywords(props: IGraphWordcloud) {
  // set references
  const containerRef = useRef<HTMLDivElement>(null);

  // set the states
  let [initialized, setInitialized] = useState(false);
  const [width, setWidth] = useState<number | null | undefined>();
  const [height, setHeight] = useState<number | null | undefined>();

  useEffect(() => {
    // update the width and height every 10ms
    const interval = setInterval(() => {
      setWidth(containerRef?.current?.offsetWidth);
      setHeight(containerRef?.current?.offsetHeight);
    }, 10);
    // Remove event listener on cleanup
    return () => clearInterval(interval);
  }, []);

  // create the visualization
  useEffect(() => {
    // chech if we have everything so that we can start creating the graph
    if (!props.data || !containerRef.current || !width || !height) {
      return;
    }

    // prepare static values
    const margin = {
      top: 10,
      left: 10,
      right: 10,
      bottom: 10,
    };

    // get he min and maximum weight
    const weights = props.data.map((val) => val.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);

    // set the minimum and maximum font size
    const minFontSize = 10;
    const maxFontSize = 40;

    // set the css classes
    const classes = [styles.small, styles.medium, styles.large];

    // create the font size scale
    const fontSizeScale = createFontSizeScale(
      minWeight,
      maxWeight,
      minFontSize,
      maxFontSize
    );

    // create the class scale
    const classScale = createClassScale(minWeight, maxWeight, classes);

    // format the data
    const data = props.data.map((d: IKeyword) => ({
      text: d.keyword ? d.keyword.toUpperCase() : "",
      size: minWeight === maxWeight ? maxFontSize : fontSizeScale(d.weight),
      colorClass:
        minWeight === maxWeight
          ? classes[classes.length - 1]
          : classScale(d.weight),
    }));

    if (!initialized) {
      // create the svg element
      const svg = createSVG(containerRef.current, width, height, margin);
      const wc = svg.append("g").attr("class", "wordcloud");
      // calculate and visualize the wordcloud
      calculateWordcloud(data, width, height)
        .on("end", (words) => {
          setWordcloud(wc, words);
        })
        .start();
      setInitialized(true);
    } else {
      // update the svg element
      const svg = updateSVG(containerRef.current, width, height, margin);
      const wc = svg.select("g.wordcloud");
      // calculate and visualize the wordcloud
      calculateWordcloud(data, width, height)
        .on("end", (words) => {
          setWordcloud(wc, words);
        })
        .start();
    }
  }, [props.data, width, height, containerRef, initialized]);

  // assign the container style
  const containerStyle = classnames(styles.container, props.className);

  return <div className={containerStyle} ref={containerRef}></div>;
}

// ==============================================
// Graph Helper Functions
// ==============================================

function createFontSizeScale(
  minWeight: number,
  maxWeight: number,
  minFontSize: number,
  maxFontSize: number
) {
  return d3
    .scaleLinear()
    .domain([minWeight, maxWeight])
    .range([minFontSize, maxFontSize]);
}

function createClassScale(
  minWeight: number,
  maxWeight: number,
  classes: any[]
) {
  return d3.scaleQuantize().domain([minWeight, maxWeight]).range(classes);
}

function calculateWordcloud(data: any, width: number, height: number) {
  return cloud()
    .size([width, height])
    .timeInterval(10)
    .words(data)
    .rotate(0)
    .random(() => 0.5)
    .fontWeight(900)
    .font("Lato")
    .fontSize((d) => d.size as number);
}

function createSVG(
  div: HTMLDivElement,
  width: number,
  height: number,
  margin: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }
) {
  return d3
    .select(div)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("class", "graph")
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .attr("transform", `translate(${width / 2}, ${height / 2})`);
}

function updateSVG(
  div: HTMLDivElement,
  width: number,
  height: number,
  margin: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  }
) {
  return d3
    .select(div)
    .select("svg")
    .attr("width", width)
    .attr("height", height)
    .select("g.graph")
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom)
    .attr("transform", `translate(${width / 2}, ${height / 2})`);
}

function setWordcloud(container: any, words: cloud.Word[]) {
  // set the words data
  const wordcloud = container.selectAll("text").data(words);
  //
  wordcloud
    .enter()
    .append("text")
    .attr("class", (d: any) => d.colorClass)
    .attr("text-anchor", "middle")
    .attr("transform", (d: any) => `translate(${d.x}, ${d.y})`)
    .style("font-size", (d: any) => `${d.size}dx`)
    .text((d: any) => d.text);

  wordcloud
    .attr("class", (d: any) => d.colorClass)
    .attr("text-anchor", "middle")
    .attr("transform", (d: any) => `translate(${d.x}, ${d.y})`)
    .style("font-size", (d: any) => `${d.size}px`)
    .text((d: any) => d.text);

  wordcloud.exit().remove();
}
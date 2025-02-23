import {createCanvas} from "canvas";
import * as fs from "fs";

type DataArray = number[][];

interface ImageOptions {
  cellSize?: number;
  activeColor?: string;
  inactiveColor?: string;
  gridLineColor?: string;
  lineWidth?: number;
  fontSize?: number;
  showNumbers?: boolean;
  padding?: number;
  borderWidth?: number;
}

interface Dimensions {
  width: number;
  height: number;
}

//產生格子表格
export class GridImageGenerator {
  private readonly data: DataArray;
  private readonly outputFilePath: string;
  private readonly options: Required<ImageOptions>;
  private readonly dimensions: Dimensions;

  private static readonly DEFAULT_OPTIONS: Required<ImageOptions> = {
    cellSize: 20,
    activeColor: "#1b7d9e",
    inactiveColor: "#CCCCCC",
    gridLineColor: "#000000",
    lineWidth: 1,
    fontSize: 12,
    showNumbers: true,
    padding: 10,
    borderWidth: 1,
  };

  constructor(
    data: DataArray,
    outputFilePath: string,
    options: ImageOptions = {}
  ) {
    this.validateInput(data);

    this.data = data;
    this.outputFilePath = outputFilePath;
    this.options = {...GridImageGenerator.DEFAULT_OPTIONS, ...options};

    this.dimensions = this.calculateDimensions();
  }
  //產生影像
  public async generateImage(): Promise<void> {
    try {
      const canvas = createCanvas(
        this.dimensions.width,
        this.dimensions.height
      );

      const ctx = canvas.getContext(
        "2d"
      ) as unknown as CanvasRenderingContext2D;
      this.drawBackground(ctx);
      this.drawCells(ctx);
      this.drawGrid(ctx);

      await this.saveImage(canvas);

      console.log(`Image successfully saved to ${this.outputFilePath}`);
    } catch (error) {
      console.error("Error generating image:", error);
      throw new Error(`Failed to generate image: ${error}}`);
    }
  }

  private validateInput(data: DataArray): void {
    if (!data || !data.length || !data[0].length) {
      throw new Error("Invalid input data: Array must not be empty");
    }

    const rowLength = data[0].length;
    const isValid = data.every(
      (row) =>
        row.length === rowLength &&
        row.every((cell) => cell === 0 || cell === 1)
    );

    if (!isValid) {
      throw new Error(
        "Invalid input data: All rows must have equal length and contain only 0 or 1"
      );
    }
  }

  private calculateDimensions(): Dimensions {
    const contentWidth = this.data[0].length * this.options.cellSize;
    const contentHeight = this.data.length * this.options.cellSize;

    return {
      width: contentWidth + this.options.padding * 2,
      height: contentHeight + this.options.padding * 2,
    };
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, this.dimensions.width, this.dimensions.height);
  }

  private drawCells(ctx: CanvasRenderingContext2D): void {
    for (let index = 0; index < this.data.length; index++) {
      let row = this.data[index];
      if (index + 1 == this.data.length) {
        //畫出預期號碼
        row.forEach((cell, j) => {
          const color = cell === 1 ? "#5980e3" : this.options.inactiveColor;
          this.drawCell(ctx, j, index, color, j + 1);
        });
      } else {
        row.forEach((cell, j) => {
          const color =
            cell === 1 ? this.options.activeColor : this.options.inactiveColor;
          this.drawCell(ctx, j, index, color, j + 1);
        });
      }
    }
    /*
    this.data.forEach((row, i) => {
      row.forEach((cell, j) => {
        const color =
          cell === 1 ? this.options.activeColor : this.options.inactiveColor;
        this.drawCell(ctx, j, i, color, j + 1);
      });
      *
    });
    */
  }

  private drawCell(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    number: number
  ): void {
    const xPos = x * this.options.cellSize + this.options.padding;
    const yPos = y * this.options.cellSize + this.options.padding;

    // Draw cell background
    ctx.fillStyle = color;
    ctx.fillRect(xPos, yPos, this.options.cellSize, this.options.cellSize);

    // Draw number if enabled
    if (this.options.showNumbers) {
      this.drawNumber(ctx, number, xPos, yPos);
    }
  }

  private drawNumber(
    ctx: CanvasRenderingContext2D,
    number: number,
    x: number,
    y: number
  ): void {
    ctx.font = `${this.options.fontSize}px Arial`;
    ctx.fillStyle = "#000000";

    const text = number.toString();
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = this.options.fontSize;

    ctx.fillText(
      text,
      x + (this.options.cellSize - textWidth) / 2,
      y + (this.options.cellSize + textHeight) / 2 - 2
    );
  }
  //畫格子線
  private drawGrid(ctx: CanvasRenderingContext2D): void {
    const {width, height} = this.dimensions;
    const {cellSize, gridLineColor, lineWidth, padding} = this.options;

    ctx.strokeStyle = gridLineColor;
    ctx.lineWidth = lineWidth;

    // Draw vertical lines
    for (let x = 0; x <= this.data[0].length; x++) {
      const xPos = x * cellSize + padding;
      ctx.beginPath();
      ctx.moveTo(xPos, padding);
      ctx.lineTo(xPos, height - padding);
      ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= this.data.length; y++) {
      const yPos = y * cellSize + padding;
      ctx.beginPath();
      ctx.moveTo(padding, yPos);
      ctx.lineTo(width - padding, yPos);
      ctx.stroke();
    }

    // Draw border
    if (this.options.borderWidth > 0) {
      ctx.lineWidth = this.options.borderWidth;
      ctx.strokeRect(
        padding - lineWidth / 2,
        padding - lineWidth / 2,
        width - padding * 2 + lineWidth,
        height - padding * 2 + lineWidth
      );
    }
  }
  private async saveImage(canvas: any): Promise<void> {
    const buffer = canvas.toBuffer("image/png");
    await fs.promises.writeFile(this.outputFilePath, buffer);
  }
}

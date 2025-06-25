import React from 'react'
import { Chart } from '@/store/slide/slices/presentationGeneration';
import { renderChart } from '../slide_config';
import { RootState } from '@/store/slide/store';
import { useSelector } from 'react-redux';

const MiniCharts = ({ chartData }: { chartData: Chart }) => {
    const { currentColors } = useSelector((state: RootState) => state.theme);
    return (

        <div className="w-full   h-full  pointer-events-none">
            {renderChart(chartData, true, currentColors)}
        </div>

    )
}

export default MiniCharts

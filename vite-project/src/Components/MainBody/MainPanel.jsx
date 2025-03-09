import CpuUsage from "./CpuUsage";
import GpuUsage from "./GpuUsage";
import InternetSpeed from "./InternetSpeed";
import IpPanel from "./IpPanel";

export default function MainPanel() {

    return (
        <>
            <div className="all-main-panel flex-grow h-full pl-2 py-20 pr-[70px] overflow-auto">
                <div className="system-logs-text">System Logs</div>

                <div className="main-top-panel flex flex-wrap gap-10 mt-10">
                    <CpuUsage />
                    <GpuUsage />
                    <IpPanel />
                    <InternetSpeed />
                </div>

            </div>
        </>
    )

}
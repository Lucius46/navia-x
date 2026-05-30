from datetime import UTC, datetime
from html import escape
from typing import Annotated

from fastapi import APIRouter, Depends, Form, Request, status
from fastapi.responses import HTMLResponse, RedirectResponse

from app.admin_auth import (
    clear_admin_cookie,
    is_admin_authenticated,
    redirect_to_admin_login,
    set_admin_cookie,
    verify_admin_credentials,
)
from app.api.explain import get_repository
from app.config import Settings, get_settings
from app.database import DatabaseManager
from app.model_router import ModelRouter
from app.repositories.in_memory import InMemoryRepository

router = APIRouter(include_in_schema=False)


def format_datetime(value: datetime | str) -> str:
    if isinstance(value, str):
        try:
            value = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return value

    return value.astimezone(UTC).strftime("%Y-%m-%d %H:%M UTC")


def render_shell(title: str, body: str) -> str:
    return f"""<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{escape(title)}</title>
    <style>
      :root {{
        color-scheme: dark;
        --bg: #121212;
        --panel: #222222;
        --panel-soft: #303030;
        --line: rgba(255, 255, 255, 0.09);
        --text: #f5f5f5;
        --muted: #a3a3a3;
        --accent: #e5e5e5;
        --danger: #fecaca;
      }}
      * {{ box-sizing: border-box; }}
      body {{
        margin: 0;
        min-height: 100vh;
        font-family: "SF Pro Display", "Segoe UI", Arial, sans-serif;
        background:
          radial-gradient(circle at top left, rgba(255,255,255,0.06), transparent 22%),
          linear-gradient(180deg, #151515 0%, #101010 100%);
        color: var(--text);
      }}
      a {{ color: inherit; text-decoration: none; }}
      .page {{
        width: min(1280px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 24px 0 40px;
      }}
      .card {{
        background: rgba(34, 34, 34, 0.96);
        border: 1px solid var(--line);
        border-radius: 26px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
      }}
      .hero {{
        padding: 28px;
        display: flex;
        justify-content: space-between;
        gap: 18px;
        align-items: flex-start;
        margin-bottom: 18px;
      }}
      .eyebrow {{
        margin: 0;
        font-size: 11px;
        letter-spacing: 0.28em;
        text-transform: uppercase;
        color: var(--muted);
      }}
      h1, h2, h3, p {{ margin: 0; }}
      h1 {{
        margin-top: 12px;
        font-size: 32px;
        line-height: 1.15;
      }}
      .hero p.copy {{
        margin-top: 14px;
        max-width: 760px;
        color: #d4d4d4;
        line-height: 1.75;
        font-size: 14px;
      }}
      .logout {{
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }}
      .button, button {{
        border: 0;
        cursor: pointer;
        border-radius: 999px;
        padding: 11px 18px;
        font-size: 14px;
        font-weight: 600;
        background: var(--accent);
        color: #111111;
      }}
      .button.secondary {{
        background: var(--panel-soft);
        color: var(--text);
        border: 1px solid var(--line);
      }}
      .grid {{
        display: grid;
        gap: 18px;
      }}
      .metric-grid {{
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        margin-bottom: 18px;
      }}
      .metric {{
        padding: 20px;
      }}
      .metric strong {{
        display: block;
        margin-top: 14px;
        font-size: 28px;
      }}
      .metric span {{
        display: block;
        margin-top: 8px;
        color: var(--muted);
        line-height: 1.6;
        font-size: 13px;
      }}
      .panel-grid {{
        grid-template-columns: 1.1fr 0.9fr;
        margin-bottom: 18px;
      }}
      .section {{
        padding: 22px;
      }}
      .section-title {{
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }}
      .section-title h2 {{
        font-size: 20px;
      }}
      table {{
        width: 100%;
        border-collapse: collapse;
      }}
      th, td {{
        text-align: left;
        padding: 12px 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        font-size: 13px;
        vertical-align: top;
      }}
      th {{
        color: var(--muted);
        font-weight: 500;
        border-top: 0;
      }}
      .pill {{
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 6px 10px;
        background: var(--panel-soft);
        border: 1px solid var(--line);
        color: #e5e5e5;
        font-size: 12px;
      }}
      .note-list {{
        display: grid;
        gap: 12px;
      }}
      .note-item {{
        background: var(--panel-soft);
        border: 1px solid var(--line);
        border-radius: 20px;
        padding: 14px;
      }}
      .note-item strong {{
        display: block;
        font-size: 14px;
      }}
      .note-item span {{
        display: block;
        margin-top: 7px;
        color: var(--muted);
        line-height: 1.65;
        font-size: 13px;
      }}
      .stack {{
        display: grid;
        gap: 18px;
      }}
      .empty {{
        color: var(--muted);
        font-size: 13px;
      }}
      .auth-wrap {{
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 20px;
      }}
      .auth-card {{
        width: min(460px, 100%);
        padding: 28px;
      }}
      label {{
        display: block;
        margin-top: 16px;
        font-size: 13px;
        color: var(--muted);
      }}
      input {{
        width: 100%;
        margin-top: 8px;
        padding: 13px 14px;
        border-radius: 18px;
        border: 1px solid var(--line);
        background: var(--panel-soft);
        color: var(--text);
        outline: none;
      }}
      .error {{
        margin-top: 16px;
        padding: 12px 14px;
        border-radius: 18px;
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.18);
        color: var(--danger);
        font-size: 13px;
      }}
      .submit {{
        width: 100%;
        margin-top: 22px;
      }}
      .subcopy {{
        margin-top: 12px;
        color: var(--muted);
        line-height: 1.7;
        font-size: 14px;
      }}
      @media (max-width: 980px) {{
        .hero,
        .panel-grid {{
          grid-template-columns: 1fr;
          display: grid;
        }}
      }}
    </style>
  </head>
  <body>{body}</body>
</html>"""


def render_login_page(error_message: str | None, settings: Settings) -> str:
    error_block = (
        f'<div class="error">{escape(error_message)}</div>' if error_message else ""
    )
    body = f"""
    <div class="auth-wrap">
      <section class="card auth-card">
        <p class="eyebrow">Admin Login</p>
        <h1>后端管理模式</h1>
        <p class="subcopy">
          这个网页版本只提供给管理员自己使用。登录后可以查看用户、请求日志、模型状态和最近解析记录。
        </p>
        <form method="post" action="/admin/login">
          <label>
            管理员邮箱
            <input name="email" type="email" value="{escape(settings.admin_email)}" />
          </label>
          <label>
            管理员密码
            <input name="password" type="password" placeholder="请输入管理密码" />
          </label>
          {error_block}
          <button class="submit" type="submit">进入管理后台</button>
        </form>
      </section>
    </div>
    """
    return render_shell("Navia-X (SBP) Admin Login", body)


def metric_card(label: str, value: str, note: str) -> str:
    return f"""
    <section class="card metric">
      <p class="eyebrow">{escape(label)}</p>
      <strong>{escape(value)}</strong>
      <span>{escape(note)}</span>
    </section>
    """


def render_rows(rows: list[str], empty_copy: str, colspan: int) -> str:
    if rows:
        return "".join(rows)
    return f'<tr><td class="empty" colspan="{colspan}">{escape(empty_copy)}</td></tr>'


def render_dashboard_page(
    settings: Settings,
    repository: InMemoryRepository,
) -> str:
    usage = repository.usage_summary()
    users = repository.list_users()
    logs = repository.list_logs()[:12]
    history = repository.list_history(limit=12)
    health = {
        "environment": settings.app_env,
        "mock_mode": settings.mock_ai_responses,
        "database_configured": DatabaseManager(settings).is_configured(),
        "timestamp": datetime.now(UTC),
    }
    model_statuses = ModelRouter(settings).list_provider_status()

    user_rows = [
        f"""
        <tr>
          <td>{escape(item.email)}</td>
          <td>{escape(item.role)}</td>
          <td>{escape(item.access_status)}</td>
          <td>{item.daily_usage_count}</td>
          <td>{escape(format_datetime(item.created_at))}</td>
        </tr>
        """
        for item in users
    ]
    log_rows = [
        f"""
        <tr>
          <td>{escape(item.user_email)}</td>
          <td>{escape(item.model)}</td>
          <td>{escape(item.provider)}</td>
          <td>{escape(item.status)}</td>
          <td>{item.latency_ms} ms</td>
          <td>{escape(item.error_message or "-")}</td>
        </tr>
        """
        for item in logs
    ]
    history_rows = [
        f"""
        <tr>
          <td>{escape(format_datetime(item.created_at))}</td>
          <td>{escape(item.user_email)}</td>
          <td>{escape(item.mode)}</td>
          <td>{escape(item.text_preview)}</td>
          <td>{escape(item.status)}</td>
        </tr>
        """
        for item in history
    ]
    status_notes = [
        f"""
        <div class="note-item">
          <strong>{escape(item["provider"])} · {escape(item["active_model"])}</strong>
          <span>{"已启用" if item["enabled"] else "未启用"} · {escape(item["note"])}</span>
        </div>
        """
        for item in model_statuses
    ]

    warning_note = ""
    if settings.uses_default_admin_password or settings.uses_default_jwt_secret:
        warning_note = """
        <div class="note-item">
          <strong>安全提醒</strong>
          <span>当前仍在使用默认管理员密码或默认会话密钥。部署前请在环境变量中设置 ADMIN_PASSWORD 与 JWT_SECRET。</span>
        </div>
        """

    body = f"""
    <div class="page">
      <section class="card hero">
        <div>
          <p class="eyebrow">Admin Web</p>
          <h1>Navia-X (SBP) 后端管理模式</h1>
          <p class="copy">
            管理端已经从用户前端拆出，只保留在后端网页里。这里可以集中查看系统健康、模型状态、测试用户和请求日志，
            用户侧网页与桌面端只负责解析体验。
          </p>
        </div>
        <form class="logout" method="post" action="/admin/logout">
          <span class="pill">{escape(settings.admin_name)} · {escape(settings.admin_email)}</span>
          <button class="button secondary" type="submit">退出登录</button>
        </form>
      </section>

      <div class="grid metric-grid">
        {metric_card("今日请求", str(usage.total_requests_today), "当天解释请求总量")}
        {metric_card("活跃用户", str(usage.active_users), "按历史记录汇总的用户数")}
        {metric_card("平均延迟", f"{usage.average_latency_ms} ms", "以当前请求日志计算")}
        {metric_card("系统状态", "管理中", f"环境 {health['environment']} · Mock {'开' if health['mock_mode'] else '关'}")}
      </div>

      <div class="grid panel-grid">
        <section class="card section">
          <div class="section-title">
            <div>
              <p class="eyebrow">Model Status</p>
              <h2>模型与运行状态</h2>
            </div>
            <span class="pill">{escape(format_datetime(health["timestamp"]))}</span>
          </div>
          <div class="note-list">
            <div class="note-item">
              <strong>数据库连接</strong>
              <span>{"已配置持久化连接" if health["database_configured"] else "当前仍使用内存仓库，适合本地管理模式"}</span>
            </div>
            {warning_note}
            {"".join(status_notes)}
          </div>
        </section>

        <section class="card section">
          <div class="section-title">
            <div>
              <p class="eyebrow">Usage Summary</p>
              <h2>请求概览</h2>
            </div>
            <span class="pill">成功 {usage.successful_requests_today} / 失败 {usage.failed_requests_today}</span>
          </div>
          <div class="note-list">
            {"".join(
                f'<div class="note-item"><strong>{escape(point.label)}</strong><span>{point.requests} 次请求</span></div>'
                for point in usage.series
            )}
          </div>
        </section>
      </div>

      <div class="stack">
        <section class="card section">
          <div class="section-title">
            <div>
              <p class="eyebrow">Admin Users</p>
              <h2>测试用户</h2>
            </div>
            <span class="pill">单管理员登录可见</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>邮箱</th>
                <th>角色</th>
                <th>状态</th>
                <th>今日请求</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>{render_rows(user_rows, "暂无用户数据。", 5)}</tbody>
          </table>
        </section>

        <section class="card section">
          <div class="section-title">
            <div>
              <p class="eyebrow">Request Logs</p>
              <h2>请求日志</h2>
            </div>
            <span class="pill">/api/admin/* 已受登录保护</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>用户</th>
                <th>模型</th>
                <th>Provider</th>
                <th>状态</th>
                <th>延迟</th>
                <th>错误信息</th>
              </tr>
            </thead>
            <tbody>{render_rows(log_rows, "当前还没有请求日志。", 6)}</tbody>
          </table>
        </section>

        <section class="card section">
          <div class="section-title">
            <div>
              <p class="eyebrow">Recent History</p>
              <h2>最近解析记录</h2>
            </div>
            <span class="pill">用户前端已不展示后台视图</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>用户</th>
                <th>模式</th>
                <th>内容摘要</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>{render_rows(history_rows, "当前还没有历史记录。", 5)}</tbody>
          </table>
        </section>
      </div>
    </div>
    """
    return render_shell("Navia-X (SBP) Admin", body)


@router.get("/admin/login", response_class=HTMLResponse, response_model=None)
def admin_login_page(
    request: Request,
    settings: Settings = Depends(get_settings),
) -> HTMLResponse | RedirectResponse:
    if is_admin_authenticated(request, settings):
        return RedirectResponse(url="/admin", status_code=status.HTTP_303_SEE_OTHER)
    return HTMLResponse(render_login_page(error_message=None, settings=settings))


@router.post("/admin/login", response_class=HTMLResponse, response_model=None)
def admin_login_submit(
    email: Annotated[str, Form()],
    password: Annotated[str, Form()],
    settings: Settings = Depends(get_settings),
) -> HTMLResponse | RedirectResponse:
    if not verify_admin_credentials(email, password, settings):
        return HTMLResponse(
            render_login_page("邮箱或密码不正确。", settings),
            status_code=status.HTTP_401_UNAUTHORIZED,
        )

    response = RedirectResponse(url="/admin", status_code=status.HTTP_303_SEE_OTHER)
    set_admin_cookie(response, settings)
    return response


@router.post("/admin/logout", response_model=None)
def admin_logout() -> RedirectResponse:
    response = redirect_to_admin_login()
    clear_admin_cookie(response)
    return response


@router.get("/admin", response_class=HTMLResponse, response_model=None)
def admin_dashboard(
    request: Request,
    settings: Settings = Depends(get_settings),
    repository: InMemoryRepository = Depends(get_repository),
) -> HTMLResponse | RedirectResponse:
    if not is_admin_authenticated(request, settings):
        return redirect_to_admin_login()

    return HTMLResponse(render_dashboard_page(settings, repository))
